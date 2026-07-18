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
import {
  DepartmentUpsertRowInput,
  DepartmentTranslationUpsertRowInput,
  DepartmentCategoryUpsertRowInput,
  DepartmentCategoryTranslationUpsertRowInput,
  ProductCategoryUpsertRowInput,
  ProductCategoryTranslationUpsertRowInput,
} from './dto';

type BulkOutcome = { outcome: 'created' | 'updated'; id: number };

type BulkResult = {
  created: number;
  updated: number;
  failed: number;
  createdIds: number[];
  errors: { index: number; id?: number | null; message: string }[];
};

/**
 * Admin Catalog Service - Raw reads and write operations over the marketplace
 * catalog tables (departments, department categories, product categories and
 * their translations) for the platform admin panel.
 *
 * Reads return rows exactly as stored (all translations, inactive included).
 * Writes are bulk upserts designed for XLSX imports; a single-row array is the
 * row-by-row edit path of the admin panel. Rows are processed independently so
 * one bad spreadsheet line never aborts the whole import.
 */
@Injectable()
export class AdminCatalogService {
  private readonly logger = new Logger(AdminCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Raw reads ──────────────────────────────────────────────────────────────

  async getRawDepartments({
    adminId,
    id,
    page,
    pageSize,
    search,
  }: {
    adminId?: string;
    id?: number;
    page: number;
    pageSize: number;
    search?: string;
  }) {
    this.requireAdmin(adminId);
    const { skip, take } = calculatePrismaParams(page, pageSize);

    const where: Prisma.DepartmentWhereInput = {
      ...(id != null && { id }),
      ...(search?.trim() && {
        translations: {
          some: { name: { contains: search.trim(), mode: 'insensitive' } },
        },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.department.count({ where }),
      this.prisma.department.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: { translations: { orderBy: { language: 'asc' } } },
      }),
    ]);

    return createPaginatedResponse(rows, count, page, pageSize);
  }

  async getRawDepartmentCategories({
    adminId,
    id,
    page,
    pageSize,
    search,
    departmentId,
  }: {
    adminId?: string;
    id?: number;
    page: number;
    pageSize: number;
    search?: string;
    departmentId?: number;
  }) {
    this.requireAdmin(adminId);
    const { skip, take } = calculatePrismaParams(page, pageSize);

    const where: Prisma.DepartmentCategoryWhereInput = {
      ...(id != null && { id }),
      ...(departmentId != null && { departmentId }),
      ...(search?.trim() && {
        departmentCategoryTranslation: {
          some: { name: { contains: search.trim(), mode: 'insensitive' } },
        },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.departmentCategory.count({ where }),
      this.prisma.departmentCategory.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: {
          departmentCategoryTranslation: { orderBy: { language: 'asc' } },
        },
      }),
    ]);

    // Normalize the Prisma relation name to `translations` for the GraphQL type.
    const nodes = rows.map(({ departmentCategoryTranslation, ...row }) => ({
      ...row,
      translations: departmentCategoryTranslation,
    }));

    return createPaginatedResponse(nodes, count, page, pageSize);
  }

  async getRawProductCategories({
    adminId,
    id,
    page,
    pageSize,
    search,
    departmentCategoryId,
  }: {
    adminId?: string;
    id?: number;
    page: number;
    pageSize: number;
    search?: string;
    departmentCategoryId?: number;
  }) {
    this.requireAdmin(adminId);
    const { skip, take } = calculatePrismaParams(page, pageSize);

    const where: Prisma.ProductCategoryWhereInput = {
      ...(id != null && { id }),
      ...(departmentCategoryId != null && { departmentCategoryId }),
      ...(search?.trim() && {
        productCategoryTranslation: {
          some: { name: { contains: search.trim(), mode: 'insensitive' } },
        },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.productCategory.count({ where }),
      this.prisma.productCategory.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: {
          productCategoryTranslation: { orderBy: { language: 'asc' } },
        },
      }),
    ]);

    const nodes = rows.map(({ productCategoryTranslation, ...row }) => ({
      ...row,
      translations: productCategoryTranslation,
    }));

    return createPaginatedResponse(nodes, count, page, pageSize);
  }

  // ─── Bulk upserts ───────────────────────────────────────────────────────────

  async bulkUpsertDepartments({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: DepartmentUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        featuredFrom: row.featuredFrom,
        featuredUntil: row.featuredUntil,
      });

      if (row.id != null) {
        await this.prisma.department.update({ where: { id: row.id }, data });
        return { outcome: 'updated', id: row.id };
      }

      const created = await this.prisma.department.create({ data });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertDepartmentTranslations({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: DepartmentTranslationUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        departmentId: row.departmentId,
        language: row.language,
        name: row.name,
        slug: row.slug,
        href: row.href,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        metaKeywords: row.metaKeywords,
      });

      if (row.id != null) {
        await this.prisma.departmentTranslation.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      const { departmentId, language } = row;
      if (departmentId == null || !language) {
        throw new BadRequestException(
          'departmentId and language are required when no id is provided',
        );
      }

      const existing = await this.prisma.departmentTranslation.findUnique({
        where: { departmentId_language: { departmentId, language } },
        select: { id: true },
      });

      if (existing) {
        await this.prisma.departmentTranslation.update({
          where: { id: existing.id },
          data,
        });
        return { outcome: 'updated', id: existing.id };
      }

      this.requireFields(row, ['name', 'slug']);
      const created = await this.prisma.departmentTranslation.create({
        data: {
          departmentId,
          language,
          name: row.name!,
          slug: row.slug!,
          href: row.href,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          metaKeywords: row.metaKeywords ?? [],
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertDepartmentCategories({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: DepartmentCategoryUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        departmentId: row.departmentId,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        featuredFrom: row.featuredFrom,
        featuredUntil: row.featuredUntil,
      });

      if (row.id != null) {
        await this.prisma.departmentCategory.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      if (row.departmentId == null) {
        throw new BadRequestException(
          'departmentId is required when no id is provided',
        );
      }

      const created = await this.prisma.departmentCategory.create({
        data: { ...data, departmentId: row.departmentId },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertDepartmentCategoryTranslations({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: DepartmentCategoryTranslationUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        departmentCategoryId: row.departmentCategoryId,
        language: row.language,
        name: row.name,
        slug: row.slug,
        href: row.href,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        metaKeywords: row.metaKeywords,
      });

      if (row.id != null) {
        await this.prisma.departmentCategoryTranslation.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      const { departmentCategoryId, language } = row;
      if (departmentCategoryId == null || !language) {
        throw new BadRequestException(
          'departmentCategoryId and language are required when no id is provided',
        );
      }

      const existing =
        await this.prisma.departmentCategoryTranslation.findUnique({
          where: {
            departmentCategoryId_language: { departmentCategoryId, language },
          },
          select: { id: true },
        });

      if (existing) {
        await this.prisma.departmentCategoryTranslation.update({
          where: { id: existing.id },
          data,
        });
        return { outcome: 'updated', id: existing.id };
      }

      this.requireFields(row, ['name', 'slug']);
      const created = await this.prisma.departmentCategoryTranslation.create({
        data: {
          departmentCategoryId,
          language,
          name: row.name!,
          slug: row.slug!,
          href: row.href,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          metaKeywords: row.metaKeywords ?? [],
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertProductCategories({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: ProductCategoryUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        departmentCategoryId: row.departmentCategoryId,
        averageWeight: row.averageWeight,
        size: row.size,
        weightUnit: row.weightUnit,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        featuredFrom: row.featuredFrom,
        featuredUntil: row.featuredUntil,
      });

      if (row.id != null) {
        await this.prisma.productCategory.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      if (row.departmentCategoryId == null) {
        throw new BadRequestException(
          'departmentCategoryId is required when no id is provided',
        );
      }

      const created = await this.prisma.productCategory.create({
        data: { ...data, departmentCategoryId: row.departmentCategoryId },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertProductCategoryTranslations({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: ProductCategoryTranslationUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        productCategoryId: row.productCategoryId,
        language: row.language,
        name: row.name,
        slug: row.slug,
        keywords: row.keywords,
        href: row.href,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        metaKeywords: row.metaKeywords,
      });

      if (row.id != null) {
        await this.prisma.productCategoryTranslation.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      const { productCategoryId, language } = row;
      if (productCategoryId == null || !language) {
        throw new BadRequestException(
          'productCategoryId and language are required when no id is provided',
        );
      }

      const existing = await this.prisma.productCategoryTranslation.findUnique({
        where: {
          productCategoryId_language: { productCategoryId, language },
        },
        select: { id: true },
      });

      if (existing) {
        await this.prisma.productCategoryTranslation.update({
          where: { id: existing.id },
          data,
        });
        return { outcome: 'updated', id: existing.id };
      }

      this.requireFields(row, ['name', 'slug']);
      const created = await this.prisma.productCategoryTranslation.create({
        data: {
          productCategoryId,
          language,
          name: row.name!,
          slug: row.slug!,
          keywords: row.keywords ?? [],
          href: row.href,
          metaTitle: row.metaTitle,
          metaDescription: row.metaDescription,
          metaKeywords: row.metaKeywords ?? [],
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  // ─── Deletes ────────────────────────────────────────────────────────────────

  async deleteDepartment({ adminId, id }: { adminId?: string; id: number }) {
    this.requireAdmin(adminId);
    try {
      // Translations cascade; categories restrict (delete them first).
      await this.prisma.department.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteDepartmentTranslation({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.departmentTranslation.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteDepartmentCategory({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      // Own translations and product categories cascade, but a product category
      // that still has products restricts the whole delete.
      await this.prisma.departmentCategory.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteDepartmentCategoryTranslation({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.departmentCategoryTranslation.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteProductCategory({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      // Translations and material links cascade; products restrict.
      await this.prisma.productCategory.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteProductCategoryTranslation({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.productCategoryTranslation.delete({ where: { id } });
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

  /** Throws when any of the listed fields is missing on a create row. */
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

  /**
   * Keeps only the keys that were actually provided so an update never
   * overwrites columns the row didn't mention. Explicit null passes through
   * to clear nullable columns.
   */
  private pickDefined<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    ) as T;
  }

  /**
   * Runs the handler per row, tallying outcomes. A row failure is recorded
   * with its 0-based index (and id when present) instead of aborting the batch.
   */
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

  /** Translates Prisma error codes into messages an admin can act on. */
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
