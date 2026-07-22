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
  MaterialImpactEstimateUpsertRowInput,
  MaterialImpactEstimateTranslationUpsertRowInput,
  WaterImpactMessageUpsertRowInput,
  WaterImpactMessageTranslationUpsertRowInput,
  Co2ImpactMessageUpsertRowInput,
  Co2ImpactMessageTranslationUpsertRowInput,
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
 * Admin Impact Service — raw reads and bulk writes over the marketplace impact
 * tables (material impact estimates, water & CO2 impact messages, and their
 * translations) for the platform admin panel.
 *
 * Reads return rows exactly as stored (every translation). Writes are bulk
 * upserts shared by the XLSX import and the row-by-row edit forms (a single-row
 * array); rows are processed independently so one bad line never aborts the
 * batch.
 */
@Injectable()
export class AdminImpactService {
  private readonly logger = new Logger(AdminImpactService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Raw reads ──────────────────────────────────────────────────────────────

  async getRawMaterialImpactEstimates({
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

    const where: Prisma.MaterialImpactEstimateWhereInput = {
      ...(id != null && { id }),
      ...(search?.trim() && {
        materialType: { contains: search.trim(), mode: 'insensitive' },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.materialImpactEstimate.count({ where }),
      this.prisma.materialImpactEstimate.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: { translations: { orderBy: { language: 'asc' } } },
      }),
    ]);

    return createPaginatedResponse(rows, count, page, pageSize);
  }

  async getRawWaterImpactMessages({
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

    const where: Prisma.WaterImpactMessageWhereInput = {
      ...(id != null && { id }),
      ...(search?.trim() && {
        message1: { contains: search.trim(), mode: 'insensitive' },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.waterImpactMessage.count({ where }),
      this.prisma.waterImpactMessage.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: { translations: { orderBy: { language: 'asc' } } },
      }),
    ]);

    return createPaginatedResponse(rows, count, page, pageSize);
  }

  async getRawCo2ImpactMessages({
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

    const where: Prisma.Co2ImpactMessageWhereInput = {
      ...(id != null && { id }),
      ...(search?.trim() && {
        message1: { contains: search.trim(), mode: 'insensitive' },
      }),
    };

    const [count, rows] = await Promise.all([
      this.prisma.co2ImpactMessage.count({ where }),
      this.prisma.co2ImpactMessage.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
        include: { translations: { orderBy: { language: 'asc' } } },
      }),
    ]);

    return createPaginatedResponse(rows, count, page, pageSize);
  }

  // ─── Material impact estimates ────────────────────────────────────────────────

  async bulkUpsertMaterialImpactEstimates({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: MaterialImpactEstimateUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        materialType: row.materialType,
        estimatedCo2SavingsKG: row.estimatedCo2SavingsKG,
        estimatedWaterSavingsLT: row.estimatedWaterSavingsLT,
      });

      if (row.id != null) {
        await this.prisma.materialImpactEstimate.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      this.requireFields(row, [
        'materialType',
        'estimatedCo2SavingsKG',
        'estimatedWaterSavingsLT',
      ]);
      const created = await this.prisma.materialImpactEstimate.create({
        data: {
          materialType: row.materialType!,
          estimatedCo2SavingsKG: row.estimatedCo2SavingsKG!,
          estimatedWaterSavingsLT: row.estimatedWaterSavingsLT!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertMaterialImpactEstimateTranslations({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: MaterialImpactEstimateTranslationUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        materialImpactEstimateId: row.materialImpactEstimateId,
        language: row.language,
        materialTypeTranslation: row.materialTypeTranslation,
      });

      if (row.id != null) {
        await this.prisma.materialImpactEstimateTranslation.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      const { materialImpactEstimateId, language } = row;
      if (materialImpactEstimateId == null || !language) {
        throw new BadRequestException(
          'materialImpactEstimateId and language are required when no id is provided',
        );
      }

      const existing =
        await this.prisma.materialImpactEstimateTranslation.findUnique({
          where: {
            materialImpactEstimateId_language: {
              materialImpactEstimateId,
              language,
            },
          },
          select: { id: true },
        });

      if (existing) {
        await this.prisma.materialImpactEstimateTranslation.update({
          where: { id: existing.id },
          data,
        });
        return { outcome: 'updated', id: existing.id };
      }

      this.requireFields(row, ['materialTypeTranslation']);
      const created =
        await this.prisma.materialImpactEstimateTranslation.create({
          data: {
            materialImpactEstimateId,
            language,
            materialTypeTranslation: row.materialTypeTranslation!,
          },
        });
      return { outcome: 'created', id: created.id };
    });
  }

  // ─── Water impact messages ────────────────────────────────────────────────────

  async bulkUpsertWaterImpactMessages({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: WaterImpactMessageUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        min: row.min,
        max: row.max,
        message1: row.message1,
        message2: row.message2,
        message3: row.message3,
      });

      if (row.id != null) {
        await this.prisma.waterImpactMessage.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      this.requireFields(row, ['message1', 'message2', 'message3']);
      const created = await this.prisma.waterImpactMessage.create({
        data: {
          ...this.pickDefined({ min: row.min, max: row.max }),
          message1: row.message1!,
          message2: row.message2!,
          message3: row.message3!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertWaterImpactMessageTranslations({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: WaterImpactMessageTranslationUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        waterImpactMessageId: row.waterImpactMessageId,
        language: row.language,
        message1: row.message1,
        message2: row.message2,
        message3: row.message3,
      });

      if (row.id != null) {
        await this.prisma.waterImpactMessageTranslation.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      const { waterImpactMessageId, language } = row;
      if (waterImpactMessageId == null || !language) {
        throw new BadRequestException(
          'waterImpactMessageId and language are required when no id is provided',
        );
      }

      const existing =
        await this.prisma.waterImpactMessageTranslation.findUnique({
          where: {
            waterImpactMessageId_language: { waterImpactMessageId, language },
          },
          select: { id: true },
        });

      if (existing) {
        await this.prisma.waterImpactMessageTranslation.update({
          where: { id: existing.id },
          data,
        });
        return { outcome: 'updated', id: existing.id };
      }

      this.requireFields(row, ['message1', 'message2', 'message3']);
      const created = await this.prisma.waterImpactMessageTranslation.create({
        data: {
          waterImpactMessageId,
          language,
          message1: row.message1!,
          message2: row.message2!,
          message3: row.message3!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  // ─── CO2 impact messages ──────────────────────────────────────────────────────

  async bulkUpsertCo2ImpactMessages({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: Co2ImpactMessageUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        min: row.min,
        max: row.max,
        message1: row.message1,
        message2: row.message2,
        message3: row.message3,
      });

      if (row.id != null) {
        await this.prisma.co2ImpactMessage.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      this.requireFields(row, ['message1', 'message2', 'message3']);
      const created = await this.prisma.co2ImpactMessage.create({
        data: {
          ...this.pickDefined({ min: row.min, max: row.max }),
          message1: row.message1!,
          message2: row.message2!,
          message3: row.message3!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  async bulkUpsertCo2ImpactMessageTranslations({
    adminId,
    rows,
  }: {
    adminId?: string;
    rows: Co2ImpactMessageTranslationUpsertRowInput[];
  }): Promise<BulkResult> {
    this.requireAdmin(adminId);

    return this.processRows(rows, async (row) => {
      const data = this.pickDefined({
        co2ImpactMessageId: row.co2ImpactMessageId,
        language: row.language,
        message1: row.message1,
        message2: row.message2,
        message3: row.message3,
      });

      if (row.id != null) {
        await this.prisma.co2ImpactMessageTranslation.update({
          where: { id: row.id },
          data,
        });
        return { outcome: 'updated', id: row.id };
      }

      const { co2ImpactMessageId, language } = row;
      if (co2ImpactMessageId == null || !language) {
        throw new BadRequestException(
          'co2ImpactMessageId and language are required when no id is provided',
        );
      }

      const existing = await this.prisma.co2ImpactMessageTranslation.findUnique(
        {
          where: {
            co2ImpactMessageId_language: { co2ImpactMessageId, language },
          },
          select: { id: true },
        },
      );

      if (existing) {
        await this.prisma.co2ImpactMessageTranslation.update({
          where: { id: existing.id },
          data,
        });
        return { outcome: 'updated', id: existing.id };
      }

      this.requireFields(row, ['message1', 'message2', 'message3']);
      const created = await this.prisma.co2ImpactMessageTranslation.create({
        data: {
          co2ImpactMessageId,
          language,
          message1: row.message1!,
          message2: row.message2!,
          message3: row.message3!,
        },
      });
      return { outcome: 'created', id: created.id };
    });
  }

  // ─── Deletes ────────────────────────────────────────────────────────────────

  async deleteMaterialImpactEstimate({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      // Translations cascade; product-category / store-product compositions
      // referencing this material restrict the delete.
      await this.prisma.materialImpactEstimate.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteMaterialImpactEstimateTranslation({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.materialImpactEstimateTranslation.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteWaterImpactMessage({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.waterImpactMessage.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteWaterImpactMessageTranslation({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.waterImpactMessageTranslation.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteCo2ImpactMessage({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.co2ImpactMessage.delete({ where: { id } });
      return true;
    } catch (error) {
      throw this.friendlyError(error);
    }
  }

  async deleteCo2ImpactMessageTranslation({
    adminId,
    id,
  }: {
    adminId?: string;
    id: number;
  }) {
    this.requireAdmin(adminId);
    try {
      await this.prisma.co2ImpactMessageTranslation.delete({ where: { id } });
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
