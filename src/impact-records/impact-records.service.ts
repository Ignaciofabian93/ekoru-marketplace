import { Injectable, Logger } from '@nestjs/common';
import { ImpactKind, ImpactRole, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ImpactService } from '../services/impact.service';
import { SellerImpactYear } from './entities';

/** One completed deal, as reported by the transactions subgraph. */
export interface RecordDealImpactInput {
  dealId: number;
  kind: ImpactKind;
  buyerId: string;
  sellerId: string;
  /** SALE: the item sold. */
  productId?: number | null;
  /** EXCHANGE: the seller's item, which the buyer receives. */
  requestedProductId?: number | null;
  /** EXCHANGE: the buyer's item, which the seller receives. */
  offeredProductId?: number | null;
  occurredAt?: Date | null;
}

/** What one participant is credited with for one item. */
interface Credit {
  sellerId: string;
  role: ImpactRole;
  productId: number;
  /**
   * Whether this row counts toward a platform-wide total. Exactly one row per
   * item that changed hands carries it, so summing the table doesn't
   * double-count the two participants of a sale.
   */
  countsTowardPlatformTotal: boolean;
}

@Injectable()
export class ImpactRecordsService {
  private readonly logger = new Logger(ImpactRecordsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly impact: ImpactService,
  ) {}

  /**
   * Writes the immutable impact records for a completed deal — one per
   * participant per item.
   *
   * The CO2/water figures are computed here, once, and stored. They are never
   * recomputed: category weights and material composition are admin-editable,
   * so a later edit would otherwise rewrite past years. Storing them is also
   * what lets the product row and its images be deleted afterwards.
   *
   * Credit model: both participants are credited. In an exchange each is
   * credited for the item they RECEIVED — the thing they are now reusing
   * instead of buying new — so the two rows describe two different items and
   * both count platform-wide. In a sale both are credited for the same item,
   * so only the buyer's row does.
   *
   * Idempotent: the unique key is (dealId, sellerId, role, productId), so a
   * retry after a partial failure fills the gaps instead of duplicating.
   * Returns how many rows were written.
   */
  async recordDealImpact(input: RecordDealImpactInput): Promise<number> {
    const credits = this.creditsFor(input);
    if (credits.length === 0) {
      this.logger.warn(`Deal ${input.dealId}: no products to credit`);
      return 0;
    }

    const occurredAt = input.occurredAt ?? new Date();
    const productIds = [...new Set(credits.map((c) => c.productId))];

    // Products are read even when soft-deleted: this can run after a retry, and
    // losing the snapshot because a sweep got there first would be worse than
    // reading a retired row.
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, productCategoryId: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    // One impact computation per distinct category, not per credit.
    const categoryIds = [
      ...new Set(products.map((p) => p.productCategoryId).filter(Boolean)),
    ];
    const impactByCategory = new Map<
      number,
      { co2: number; water: number; label: string | null }
    >();
    for (const categoryId of categoryIds) {
      const result = await this.impact.calculateCategoryImpact(categoryId);
      impactByCategory.set(categoryId, {
        co2: result?.totalCo2SavingsKG ?? 0,
        water: result?.totalWaterSavingsLT ?? 0,
        label: null,
      });
    }

    const rows: Prisma.SellerImpactRecordCreateManyInput[] = [];
    for (const credit of credits) {
      const product = productById.get(credit.productId);
      if (!product) {
        this.logger.warn(
          `Deal ${input.dealId}: product ${credit.productId} not found, skipping its credit`,
        );
        continue;
      }
      const impact = impactByCategory.get(product.productCategoryId);

      rows.push({
        sellerId: credit.sellerId,
        role: credit.role,
        kind: input.kind,
        co2SavingsKG: impact?.co2 ?? 0,
        waterSavingsLT: impact?.water ?? 0,
        countsTowardPlatformTotal: credit.countsTowardPlatformTotal,
        productId: product.id,
        productCategoryId: product.productCategoryId,
        productNameSnapshot: product.name,
        categoryNameSnapshot: impact?.label ?? null,
        dealId: input.dealId,
        occurredAt,
        year: occurredAt.getUTCFullYear(),
      });
    }

    if (rows.length === 0) return 0;

    const { count } = await this.prisma.sellerImpactRecord.createMany({
      data: rows,
      skipDuplicates: true,
    });
    this.logger.log(
      `Deal ${input.dealId}: wrote ${count} impact record(s) for ${rows.length} credit(s)`,
    );
    return count;
  }

  // ─── reporting ────────────────────────────────────────────────────────────

  /** Years the seller has any recorded impact in, most recent first. */
  async impactYears(sellerId: string): Promise<number[]> {
    const rows = await this.prisma.sellerImpactRecord.groupBy({
      by: ['year'],
      where: { sellerId },
      orderBy: { year: 'desc' },
    });
    return rows.map((r) => r.year);
  }

  /**
   * A seller's savings for one year, with the breakdowns a year-in-review
   * screen needs.
   *
   * Every figure comes from the stored snapshots, so it is stable: re-running
   * this in 2030 returns exactly what it returned the day the year closed,
   * regardless of how the impact catalogue has been edited since.
   */
  async impactForYear(
    sellerId: string,
    year: number,
    topItemsLimit = 5,
  ): Promise<SellerImpactYear> {
    const where = { sellerId, year };

    const [totals, byKind, categoryGroups, topRows] = await Promise.all([
      this.prisma.sellerImpactRecord.aggregate({
        where,
        _sum: { co2SavingsKG: true, waterSavingsLT: true },
        _count: { _all: true },
      }),
      this.prisma.sellerImpactRecord.groupBy({
        by: ['kind'],
        where,
        _count: { _all: true },
      }),
      this.prisma.sellerImpactRecord.groupBy({
        by: ['productCategoryId', 'categoryNameSnapshot'],
        where,
        _sum: { co2SavingsKG: true, waterSavingsLT: true },
        _count: { _all: true },
      }),
      this.prisma.sellerImpactRecord.findMany({
        where,
        orderBy: { co2SavingsKG: 'desc' },
        take: topItemsLimit,
        select: {
          productId: true,
          productNameSnapshot: true,
          kind: true,
          role: true,
          co2SavingsKG: true,
          waterSavingsLT: true,
          occurredAt: true,
        },
      }),
    ]);

    const countOf = (kind: ImpactKind) =>
      byKind.find((k) => k.kind === kind)?._count._all ?? 0;

    return {
      year,
      totalCo2SavingsKG: totals._sum.co2SavingsKG ?? 0,
      totalWaterSavingsLT: totals._sum.waterSavingsLT ?? 0,
      totalItems: totals._count._all,
      salesCount: countOf(ImpactKind.SALE),
      exchangesCount: countOf(ImpactKind.EXCHANGE),
      byCategory: categoryGroups
        .map((group) => ({
          productCategoryId: group.productCategoryId ?? undefined,
          categoryName: group.categoryNameSnapshot ?? undefined,
          itemCount: group._count._all,
          co2SavingsKG: group._sum.co2SavingsKG ?? 0,
          waterSavingsLT: group._sum.waterSavingsLT ?? 0,
        }))
        .sort((a, b) => b.co2SavingsKG - a.co2SavingsKG),
      topItems: topRows.map((row) => ({
        productId: row.productId ?? undefined,
        productName: row.productNameSnapshot ?? undefined,
        kind: row.kind,
        role: row.role,
        co2SavingsKG: row.co2SavingsKG,
        waterSavingsLT: row.waterSavingsLT,
        occurredAt: row.occurredAt,
      })),
    };
  }

  /**
   * Maps a deal onto who is credited for which item.
   *
   * EXCHANGE — the buyer proposed the trade, so `requestedProductId` is the
   * seller's item (which the buyer receives) and `offeredProductId` is the
   * buyer's (which the seller receives). Each credit covers a distinct item,
   * so both count platform-wide.
   *
   * SALE — one item, both participants credited, only the buyer's row counts.
   */
  private creditsFor(input: RecordDealImpactInput): Credit[] {
    if (input.kind === ImpactKind.EXCHANGE) {
      const credits: Credit[] = [];
      if (input.requestedProductId != null) {
        credits.push({
          sellerId: input.buyerId,
          role: ImpactRole.BUYER,
          productId: input.requestedProductId,
          countsTowardPlatformTotal: true,
        });
      }
      if (input.offeredProductId != null) {
        credits.push({
          sellerId: input.sellerId,
          role: ImpactRole.SELLER,
          productId: input.offeredProductId,
          countsTowardPlatformTotal: true,
        });
      }
      return credits;
    }

    if (input.productId == null) return [];
    return [
      {
        sellerId: input.buyerId,
        role: ImpactRole.BUYER,
        productId: input.productId,
        countsTowardPlatformTotal: true,
      },
      {
        sellerId: input.sellerId,
        role: ImpactRole.SELLER,
        productId: input.productId,
        // Same item as the buyer's row — counting both would double the
        // platform figure.
        countsTowardPlatformTotal: false,
      },
    ];
  }
}
