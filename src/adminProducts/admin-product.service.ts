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
import { ProductUpsertRowInput } from './dto';

type BulkOutcome = { outcome: 'created' | 'updated'; id: number };

type BulkResult = {
  created: number;
  updated: number;
  failed: number;
  createdIds: number[];
  errors: { index: number; id?: number | null; message: string }[];
};

/**
 * Admin Product Service — raw reads and bulk writes over the marketplace
 * Product table for the platform admin panel.
 *
 * Reads bypass the web `isActive: true` / `deletedAt: null` filter so the admin
 * sees the whole catalog (inactive and soft-deleted included). Writes are bulk
 * upserts of the flat product columns, shared by the XLSX import and the
 * row-by-row edit form; engagement metrics are read-only. Rows are processed
 * independently so one bad line never aborts the batch.
 */
@Injectable()
export class AdminProductService {
  private readonly logger = new Logger(AdminProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRawProducts({
    adminId,
    id,
    page,
    pageSize,
    search,
    productCategoryId,
    sellerId,
    deleted,
  }: {
    adminId?: string;
    id?: number;
    page: number;
    pageSize: number;
    search?: string;
    productCategoryId?: number;
    sellerId?: string;
    deleted?: boolean;
  }) {
    this.requireAdmin(adminId);
    const { skip, take } = calculatePrismaParams(page, pageSize);

    const where: Prisma.ProductWhereInput = {
      ...(id != null && { id }),
      ...(productCategoryId != null && { productCategoryId }),
      ...(sellerId && { sellerId }),
      // deleted omitted → all rows; true → only soft-deleted; false → only live.
      ...(deleted === true && { deletedAt: { not: null } }),
      ...(deleted === false && { deletedAt: null }),
      ...(search?.trim() && {
        name: { contains: search.trim(), mode: 'insensitive' },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
    ]);

    return createPaginatedResponse(rows, count, page, pageSize);
  }

  async bulkUpsertProducts({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: ProductUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        name: row.name,
        description: row.description,
        color: row.color,
        images: row.images,
        brand: row.brand,
        price: row.price,
        productCategoryId: row.productCategoryId,
        badges: row.badges,
        interests: row.interests,
        condition: row.condition,
        conditionDescription: row.conditionDescription,
        isActive: row.isActive,
        isExchangeable: row.isExchangeable,
        sellerId: row.sellerId,
        featuredFrom: row.featuredFrom,
        featuredUntil: row.featuredUntil,
      });

      if (row.id != null) {
        await this.prisma.product.update({ where: { id: row.id }, data });
        return { outcome: 'updated', id: row.id };
      }

      this.requireFields(row, [
        'name',
        'description',
        'brand',
        'price',
        'sellerId',
        'productCategoryId',
      ]);
      const created = await this.prisma.product.create({
        data: {
          ...data,
          name: row.name!,
          description: row.description!,
          brand: row.brand!,
          price: row.price!,
          sellerId: row.sellerId!,
          productCategoryId: row.productCategoryId!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async deleteProduct({ adminId, id }: { adminId?: string; id: number }) {
    this.requireAdmin(adminId);
    try {
      // Hard delete. Fails (P2003) while order items, exchanges or chats still
      // reference the product — the safe path for those is setting isActive
      // false (or the seller's soft delete) via the upsert.
      await this.prisma.product.delete({ where: { id } });
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
        `Bulk upsert finished with ${result.failed} failed row(s): ` +
          result.errors
            .map(
              (e) => `#${e.index}${e.id ? ` (id ${e.id})` : ''}: ${e.message}`,
            )
            .join(' | '),
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
