import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators';
// Reuse the shared bulk-result type from adminCatalog — redefining the
// `BulkUpsertResult` ObjectType would collide in the federated schema.
import { BulkUpsertResultEntity } from '../../adminCatalog/entities';
import {
  RawMaterialImpactEstimateConnectionEntity,
  RawWaterImpactMessageConnectionEntity,
  RawCo2ImpactMessageConnectionEntity,
} from '../entities';
import {
  RawImpactListArgs,
  MaterialImpactEstimateUpsertRowInput,
  MaterialImpactEstimateTranslationUpsertRowInput,
  WaterImpactMessageUpsertRowInput,
  WaterImpactMessageTranslationUpsertRowInput,
  Co2ImpactMessageUpsertRowInput,
  Co2ImpactMessageTranslationUpsertRowInput,
} from '../dto';
import { AdminImpactService } from '../admin-impact.service';

/**
 * Admin Impact GraphQL Resolver
 *
 * Platform-admin surface over the marketplace impact tables (material impact
 * estimates, water & CO2 impact messages). Every operation requires the
 * x-admin-id header set by the gateway. Reads return rows exactly as stored;
 * writes are bulk upserts shared by the XLSX import and the row-by-row edit
 * forms, plus per-row deletes.
 */
@Resolver()
export class AdminImpactResolver {
  private readonly logger = new Logger(AdminImpactResolver.name);

  constructor(private readonly adminImpactService: AdminImpactService) {}

  // ─── Raw reads ──────────────────────────────────────────────────────────────

  @Query(() => RawMaterialImpactEstimateConnectionEntity, {
    name: 'rawMaterialImpactEstimates',
    description:
      'Paginated material impact estimates with every translation. Admins only.',
  })
  async getRawMaterialImpactEstimates(
    @Args() { id, page, pageSize, search }: RawImpactListArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawMaterialImpactEstimates(page: ${page})`);
    return this.adminImpactService.getRawMaterialImpactEstimates({
      adminId,
      id,
      page,
      pageSize,
      search,
    });
  }

  @Query(() => RawWaterImpactMessageConnectionEntity, {
    name: 'rawWaterImpactMessages',
    description:
      'Paginated water impact messages with every translation. Admins only.',
  })
  async getRawWaterImpactMessages(
    @Args() { id, page, pageSize, search }: RawImpactListArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawWaterImpactMessages(page: ${page})`);
    return this.adminImpactService.getRawWaterImpactMessages({
      adminId,
      id,
      page,
      pageSize,
      search,
    });
  }

  @Query(() => RawCo2ImpactMessageConnectionEntity, {
    name: 'rawCo2ImpactMessages',
    description:
      'Paginated CO2 impact messages with every translation. Admins only.',
  })
  async getRawCo2ImpactMessages(
    @Args() { id, page, pageSize, search }: RawImpactListArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawCo2ImpactMessages(page: ${page})`);
    return this.adminImpactService.getRawCo2ImpactMessages({
      adminId,
      id,
      page,
      pageSize,
      search,
    });
  }

  // ─── Bulk upserts ───────────────────────────────────────────────────────────

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) material impact estimates. Admins only.',
  })
  async bulkUpsertMaterialImpactEstimates(
    @Args('rows', { type: () => [MaterialImpactEstimateUpsertRowInput] })
    rows: MaterialImpactEstimateUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertMaterialImpactEstimates(${rows.length} rows)`,
    );
    return this.adminImpactService.bulkUpsertMaterialImpactEstimates({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates or updates material impact estimate translations. Rows without id ' +
      'are matched by (materialImpactEstimateId, language). Admins only.',
  })
  async bulkUpsertMaterialImpactEstimateTranslations(
    @Args('rows', {
      type: () => [MaterialImpactEstimateTranslationUpsertRowInput],
    })
    rows: MaterialImpactEstimateTranslationUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertMaterialImpactEstimateTranslations(${rows.length} rows)`,
    );
    return this.adminImpactService.bulkUpsertMaterialImpactEstimateTranslations(
      {
        adminId,
        rows,
      },
    );
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) water impact messages. Admins only.',
  })
  async bulkUpsertWaterImpactMessages(
    @Args('rows', { type: () => [WaterImpactMessageUpsertRowInput] })
    rows: WaterImpactMessageUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertWaterImpactMessages(${rows.length} rows)`,
    );
    return this.adminImpactService.bulkUpsertWaterImpactMessages({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates or updates water impact message translations. Rows without id are ' +
      'matched by (waterImpactMessageId, language). Admins only.',
  })
  async bulkUpsertWaterImpactMessageTranslations(
    @Args('rows', { type: () => [WaterImpactMessageTranslationUpsertRowInput] })
    rows: WaterImpactMessageTranslationUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertWaterImpactMessageTranslations(${rows.length} rows)`,
    );
    return this.adminImpactService.bulkUpsertWaterImpactMessageTranslations({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) CO2 impact messages. Admins only.',
  })
  async bulkUpsertCo2ImpactMessages(
    @Args('rows', { type: () => [Co2ImpactMessageUpsertRowInput] })
    rows: Co2ImpactMessageUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertCo2ImpactMessages(${rows.length} rows)`,
    );
    return this.adminImpactService.bulkUpsertCo2ImpactMessages({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates or updates CO2 impact message translations. Rows without id are ' +
      'matched by (co2ImpactMessageId, language). Admins only.',
  })
  async bulkUpsertCo2ImpactMessageTranslations(
    @Args('rows', { type: () => [Co2ImpactMessageTranslationUpsertRowInput] })
    rows: Co2ImpactMessageTranslationUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertCo2ImpactMessageTranslations(${rows.length} rows)`,
    );
    return this.adminImpactService.bulkUpsertCo2ImpactMessageTranslations({
      adminId,
      rows,
    });
  }

  // ─── Deletes ────────────────────────────────────────────────────────────────

  @Mutation(() => Boolean, {
    description:
      'Deletes a material impact estimate (translations cascade; fails while ' +
      'product-category or store-product compositions reference it). Admins only.',
  })
  async deleteMaterialImpactEstimate(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteMaterialImpactEstimate(${id})`);
    return this.adminImpactService.deleteMaterialImpactEstimate({
      adminId,
      id,
    });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a single material impact estimate translation row. Admins only.',
  })
  async deleteMaterialImpactEstimateTranslation(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: deleteMaterialImpactEstimateTranslation(${id})`,
    );
    return this.adminImpactService.deleteMaterialImpactEstimateTranslation({
      adminId,
      id,
    });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a water impact message (translations cascade). Admins only.',
  })
  async deleteWaterImpactMessage(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteWaterImpactMessage(${id})`);
    return this.adminImpactService.deleteWaterImpactMessage({ adminId, id });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a single water impact message translation row. Admins only.',
  })
  async deleteWaterImpactMessageTranslation(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteWaterImpactMessageTranslation(${id})`);
    return this.adminImpactService.deleteWaterImpactMessageTranslation({
      adminId,
      id,
    });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a CO2 impact message (translations cascade). Admins only.',
  })
  async deleteCo2ImpactMessage(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteCo2ImpactMessage(${id})`);
    return this.adminImpactService.deleteCo2ImpactMessage({ adminId, id });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a single CO2 impact message translation row. Admins only.',
  })
  async deleteCo2ImpactMessageTranslation(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteCo2ImpactMessageTranslation(${id})`);
    return this.adminImpactService.deleteCo2ImpactMessageTranslation({
      adminId,
      id,
    });
  }
}
