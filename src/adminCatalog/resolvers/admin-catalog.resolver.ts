import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators';
import {
  RawDepartmentConnectionEntity,
  RawDepartmentCategoryConnectionEntity,
  RawProductCategoryConnectionEntity,
  BulkUpsertResultEntity,
} from '../entities';
import {
  RawCatalogListArgs,
  RawDepartmentCategoriesArgs,
  RawProductCategoriesArgs,
  DepartmentUpsertRowInput,
  DepartmentTranslationUpsertRowInput,
  DepartmentCategoryUpsertRowInput,
  DepartmentCategoryTranslationUpsertRowInput,
  ProductCategoryUpsertRowInput,
  ProductCategoryTranslationUpsertRowInput,
} from '../dto';
import { AdminCatalogService } from '../admin-catalog.service';

/**
 * Admin Catalog GraphQL Resolver
 *
 * Platform-admin surface over the marketplace catalog tables. Every operation
 * requires the x-admin-id header set by the gateway; anonymous or seller
 * traffic is rejected by the service.
 *
 * Reads (`raw*`) return rows exactly as stored so the admin panel can list,
 * edit and export them. Writes are bulk upserts shared by the XLSX import and
 * the row-by-row edit forms (a single-row array), plus per-row deletes.
 */
@Resolver()
export class AdminCatalogResolver {
  private readonly logger = new Logger(AdminCatalogResolver.name);

  constructor(private readonly adminCatalogService: AdminCatalogService) {}

  // ─── Raw reads ──────────────────────────────────────────────────────────────

  @Query(() => RawDepartmentConnectionEntity, {
    name: 'rawDepartments',
    description:
      'Paginated, unprocessed departments with every translation. Admins only.',
  })
  async getRawDepartments(
    @Args() { id, page, pageSize, search }: RawCatalogListArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawDepartments(page: ${page})`);
    return this.adminCatalogService.getRawDepartments({
      adminId,
      id,
      page,
      pageSize,
      search,
    });
  }

  @Query(() => RawDepartmentCategoryConnectionEntity, {
    name: 'rawDepartmentCategories',
    description:
      'Paginated, unprocessed department categories with every translation. ' +
      'Optionally filtered by departmentId. Admins only.',
  })
  async getRawDepartmentCategories(
    @Args()
    { id, page, pageSize, search, departmentId }: RawDepartmentCategoriesArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawDepartmentCategories(page: ${page})`);
    return this.adminCatalogService.getRawDepartmentCategories({
      adminId,
      id,
      page,
      pageSize,
      search,
      departmentId,
    });
  }

  @Query(() => RawProductCategoryConnectionEntity, {
    name: 'rawProductCategories',
    description:
      'Paginated, unprocessed product categories with every translation. ' +
      'Optionally filtered by departmentCategoryId. Admins only.',
  })
  async getRawProductCategories(
    @Args()
    {
      id,
      page,
      pageSize,
      search,
      departmentCategoryId,
    }: RawProductCategoriesArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawProductCategories(page: ${page})`);
    return this.adminCatalogService.getRawProductCategories({
      adminId,
      id,
      page,
      pageSize,
      search,
      departmentCategoryId,
    });
  }

  // ─── Bulk upserts ───────────────────────────────────────────────────────────

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) departments. Admins only.',
  })
  async bulkUpsertDepartments(
    @Args('rows', { type: () => [DepartmentUpsertRowInput] })
    rows: DepartmentUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: bulkUpsertDepartments(${rows.length} rows)`);
    return this.adminCatalogService.bulkUpsertDepartments({ adminId, rows });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates or updates department translations. Rows without id are matched ' +
      'by (departmentId, language). Admins only.',
  })
  async bulkUpsertDepartmentTranslations(
    @Args('rows', { type: () => [DepartmentTranslationUpsertRowInput] })
    rows: DepartmentTranslationUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertDepartmentTranslations(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertDepartmentTranslations({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) department categories. ' +
      'Setting departmentId re-parents a category. Admins only.',
  })
  async bulkUpsertDepartmentCategories(
    @Args('rows', { type: () => [DepartmentCategoryUpsertRowInput] })
    rows: DepartmentCategoryUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertDepartmentCategories(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertDepartmentCategories({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates or updates department category translations. Rows without id are ' +
      'matched by (departmentCategoryId, language). Admins only.',
  })
  async bulkUpsertDepartmentCategoryTranslations(
    @Args('rows', { type: () => [DepartmentCategoryTranslationUpsertRowInput] })
    rows: DepartmentCategoryTranslationUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertDepartmentCategoryTranslations(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertDepartmentCategoryTranslations({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) product categories. ' +
      'Setting departmentCategoryId re-parents a product category. Admins only.',
  })
  async bulkUpsertProductCategories(
    @Args('rows', { type: () => [ProductCategoryUpsertRowInput] })
    rows: ProductCategoryUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertProductCategories(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertProductCategories({
      adminId,
      rows,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates or updates product category translations. Rows without id are ' +
      'matched by (productCategoryId, language). Admins only.',
  })
  async bulkUpsertProductCategoryTranslations(
    @Args('rows', { type: () => [ProductCategoryTranslationUpsertRowInput] })
    rows: ProductCategoryTranslationUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(
      `Mutation: bulkUpsertProductCategoryTranslations(${rows.length} rows)`,
    );
    return this.adminCatalogService.bulkUpsertProductCategoryTranslations({
      adminId,
      rows,
    });
  }

  // ─── Deletes ────────────────────────────────────────────────────────────────

  @Mutation(() => Boolean, {
    description:
      'Deletes a department (translations cascade; fails while categories exist). Admins only.',
  })
  async deleteDepartment(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteDepartment(${id})`);
    return this.adminCatalogService.deleteDepartment({ adminId, id });
  }

  @Mutation(() => Boolean, {
    description: 'Deletes a single department translation row. Admins only.',
  })
  async deleteDepartmentTranslation(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteDepartmentTranslation(${id})`);
    return this.adminCatalogService.deleteDepartmentTranslation({
      adminId,
      id,
    });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a department category (its translations and product categories ' +
      'cascade; fails while any product category still has products). Admins only.',
  })
  async deleteDepartmentCategory(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteDepartmentCategory(${id})`);
    return this.adminCatalogService.deleteDepartmentCategory({ adminId, id });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a single department category translation row. Admins only.',
  })
  async deleteDepartmentCategoryTranslation(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteDepartmentCategoryTranslation(${id})`);
    return this.adminCatalogService.deleteDepartmentCategoryTranslation({
      adminId,
      id,
    });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a product category (translations cascade; fails while products ' +
      'reference it). Admins only.',
  })
  async deleteProductCategory(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteProductCategory(${id})`);
    return this.adminCatalogService.deleteProductCategory({ adminId, id });
  }

  @Mutation(() => Boolean, {
    description:
      'Deletes a single product category translation row. Admins only.',
  })
  async deleteProductCategoryTranslation(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteProductCategoryTranslation(${id})`);
    return this.adminCatalogService.deleteProductCategoryTranslation({
      adminId,
      id,
    });
  }
}
