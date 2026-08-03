import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculatePrismaParams,
  createPaginatedResponse,
} from '../common/utils';
import { AdvertisementUpsertRowInput } from './dto';

type BulkOutcome = { outcome: 'created' | 'updated'; id: number };

type BulkResult = {
  created: number;
  updated: number;
  failed: number;
  createdIds: number[];
  errors: { index: number; id?: number | null; message: string }[];
};

/**
 * Admin Ads Service — raw reads and bulk writes over the Advertisement table
 * for the platform admin panel.
 *
 * Reads bypass the seller / isActive web scoping so the admin sees every ad.
 * Writes are bulk upserts of the flat ad columns, shared by the XLSX import and
 * the row-by-row edit form. Rows are processed independently so one bad line
 * never aborts the batch.
 */
@Injectable()
export class AdminAdsService {
  private readonly logger = new Logger(AdminAdsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRawAdvertisements({
    adminId,
    id,
    page,
    pageSize,
    search,
    adType,
    sellerId,
    isActive,
  }: {
    adminId?: string;
    id?: number;
    page: number;
    pageSize: number;
    search?: string;
    adType?: Prisma.AdvertisementWhereInput['adType'];
    sellerId?: string;
    isActive?: boolean;
  }) {
    this.requireAdmin(adminId);
    const { skip, take } = calculatePrismaParams(page, pageSize);

    const where: Prisma.AdvertisementWhereInput = {
      ...(id != null && { id }),
      ...(adType != null && { adType }),
      ...(sellerId && { sellerId }),
      ...(isActive != null && { isActive }),
      ...(search?.trim() && {
        content: { contains: search.trim(), mode: 'insensitive' },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.advertisement.count({ where }),
      this.prisma.advertisement.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
    ]);

    return createPaginatedResponse(rows, count, page, pageSize);
  }

  async bulkUpsertAdvertisements({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: AdvertisementUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        adType: row.adType,
        price: row.price,
        content: row.content,
        startDate: row.startDate,
        endDate: row.endDate,
        isActive: row.isActive,
        sellerId: row.sellerId,
        productId: row.productId,
        storeProductId: row.storeProductId,
        serviceId: row.serviceId,
      });

      if (row.id != null) {
        await this.prisma.advertisement.update({ where: { id: row.id }, data });
        return { outcome: 'updated', id: row.id };
      }

      this.requireFields(row, [
        'adType',
        'price',
        'content',
        'startDate',
        'endDate',
        'sellerId',
      ]);
      const created = await this.prisma.advertisement.create({
        data: {
          ...data,
          adType: row.adType!,
          price: row.price!,
          content: row.content!,
          startDate: row.startDate!,
          endDate: row.endDate!,
          sellerId: row.sellerId!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async deleteAdvertisement({ adminId, id }: { adminId?: string; id: number }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.advertisement.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private requireAdmin(adminId?: string): void {
    if (!adminId) {
      throw new UnauthorizedException('Admin authentication required');
    }
  }

  private requireFields<T extends object>(row: T, fields: (keyof T)[]): void {
    const missing = fields.filter(
      (f) => row[f] == null || row[f] === '',
    ) as string[];
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required field(s) for create: ${missing.join(', ')}`,
      );
    }
  }

  private pickDefined<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    ) as T;
  }

  private async processRows<T extends { id?: number | null }>(
    rows: T[],
    handler: (row: T) => Promise<BulkOutcome>,
  ): Promise<BulkResult> {
    const result: BulkResult = {
      created: 0,
      updated: 0,
      failed: 0,
      createdIds: [],
      errors: [],
    };

    for (const [index, row] of rows.entries()) {
      try {
        const { outcome, id } = await handler(row);
        result[outcome] += 1;
        if (outcome === 'created') result.createdIds.push(id);
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          index,
          id: row.id ?? null,
          message: this.errorMessage(error),
        });
      }
    }

    if (result.failed > 0) {
      this.logger.warn(
        `Bulk upsert finished with ${result.failed} failed row(s)`,
      );
    }

    return result;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const target = Array.isArray(error.meta?.target)
        ? ` (${(error.meta.target as string[]).join(', ')})`
        : '';
      switch (error.code) {
        case 'P2002':
          return `Duplicate value violates a unique constraint${target}`;
        case 'P2003':
          return 'Invalid relation: the referenced id does not exist, or dependent rows still reference this one';
        case 'P2025':
          return 'Row not found';
        default:
          return `Database error ${error.code}`;
      }
    }
    if (error instanceof Error) return error.message;
    return 'Unknown error';
  }

  private friendlyError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new BadRequestException(this.errorMessage(error));
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }
}
