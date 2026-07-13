import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Context,
  Args,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import type {
  DepartmentCategory,
  DepartmentCategoryTranslation,
} from '../../types/category';
import type { ProductCategory } from '../../types/product-category';
import type { GraphQLContext } from '../../types';
import {
  DepartmentCategoryEntity,
  DepartmentCategoryTranslationEntity,
  DepartmentCategoryProductsEntity,
} from '../entities';
import { ProductCategoryEntity } from '../../productCategories/entities';
import {
  GetDepartmentCategoriesArgs,
  GetDepartmentCategoryByIdArgs,
  GetDepartmentCategoryBySlugArgs,
  GetDepartmentCategoryProductsBySlugArgs,
} from '../dto';
import { DepartmentCategoryService } from '../department-category.service';
import { CurrentSeller } from '../../common/decorators';

/**
 * Department Category GraphQL Resolver
 *
 * This resolver handles queries and field resolutions for department categories.
 * It uses DataLoaders from the context to efficiently load translations and related data.
 */
@Resolver(() => DepartmentCategoryEntity)
export class DepartmentCategoryResolver {
  private readonly logger = new Logger(DepartmentCategoryResolver.name);

  constructor(
    private readonly departmentCategoryService: DepartmentCategoryService,
  ) {}

  /**
   * Query: Get all department categories with page-based pagination
   *
   * @example
   * query {
   *   getDepartmentCategories(page: 1, pageSize: 20, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [DepartmentCategoryEntity])
  async getDepartmentCategories(
    @Args() { page, pageSize, language }: GetDepartmentCategoriesArgs,
    @Context() context: GraphQLContext,
  ): Promise<DepartmentCategory[]> {
    this.logger.debug(
      `Query: getDepartmentCategories(page: ${page}, pageSize: ${pageSize}, language: ${language})`,
    );

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    const categories =
      await this.departmentCategoryService.getDepartmentCategories({
        page,
        pageSize,
        language,
      });

    if (categories.length > 0) {
      const categoryIds = categories.map((c) => c.id);
      await context.categoryRepository.primeTranslations(
        context.loaders.departmentCategoryTranslation,
        categoryIds,
        language,
      );
    }

    return categories;
  }

  /**
   * Query: Get a single department category by ID (admin panel)
   */
  @Query(() => DepartmentCategoryEntity, { nullable: true })
  async getDepartmentCategoryById(
    @Args() { id, language }: GetDepartmentCategoryByIdArgs,
    @Context() context: GraphQLContext,
  ): Promise<DepartmentCategory> {
    this.logger.debug(`Query: getDepartmentCategoryById(${id}, ${language})`);

    context.language = language;

    return this.departmentCategoryService.getDepartmentCategoryById({
      id,
      language,
    });
  }

  /**
   * Query: Get a single department category by slug (web browsing)
   */
  @Query(() => DepartmentCategoryEntity, { nullable: true })
  async getDepartmentCategoryBySlug(
    @Args() { slug, language }: GetDepartmentCategoryBySlugArgs,
    @Context() context: GraphQLContext,
  ): Promise<DepartmentCategory> {
    this.logger.debug(
      `Query: getDepartmentCategoryBySlug(${slug}, ${language})`,
    );

    context.language = language;

    return this.departmentCategoryService.getDepartmentCategoryBySlug({
      slug,
      language,
    });
  }

  /**
   * Query: Get a department category by slug along with its product categories
   * and the paginated list of every product inside it (web browsing)
   *
   * On the first load select the full payload; when paginating select only
   * `products` so the category data is not re-resolved.
   *
   * @example
   * query {
   *   getDepartmentCategoryProductsBySlug(slug: "television", language: ES, page: 1, pageSize: 12) {
   *     departmentCategory {
   *       id
   *       translation { name slug }
   *       productCategory { id translation { name } }
   *     }
   *     products {
   *       nodes { id name price }
   *       pageInfo { totalCount totalPages hasNextPage }
   *     }
   *   }
   * }
   */
  @Query(() => DepartmentCategoryProductsEntity, { nullable: true })
  async getDepartmentCategoryProductsBySlug(
    @Args()
    {
      slug,
      language,
      page,
      pageSize,
      filter,
      sort,
    }: GetDepartmentCategoryProductsBySlugArgs,
    @Context() context: GraphQLContext,
    @CurrentSeller() currentSellerId?: string,
  ) {
    this.logger.debug(
      `Query: getDepartmentCategoryProductsBySlug(${slug}, ${language}, page: ${page}, pageSize: ${pageSize})`,
    );

    // Override context language so nested field resolvers use the same
    // language the client explicitly requested.
    context.language = language;

    return this.departmentCategoryService.getDepartmentCategoryProductsBySlug({
      slug,
      language,
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  /**
   * Field Resolver: translation
   *
   * Resolves the translation field for a department category using DataLoader.
   * Returns a SINGLE translation object based on the current language.
   */
  @ResolveField(() => DepartmentCategoryTranslationEntity, { nullable: true })
  async translation(
    @Parent() category: DepartmentCategory,
    @Context() context: GraphQLContext,
  ): Promise<DepartmentCategoryTranslation | null> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: DepartmentCategory.translation(id: ${category.id}, language: ${language})`,
    );

    return context.categoryRepository.getTranslation(
      context.loaders.departmentCategoryTranslation,
      category.id,
      language,
    );
  }

  /**
   * Field Resolver: productCategory
   *
   * Resolves the productCategory field for a department category using DataLoader.
   * Returns an array of product categories for this department category.
   */
  @ResolveField(() => [ProductCategoryEntity])
  async productCategory(
    @Parent() category: DepartmentCategory,
    @Context() context: GraphQLContext,
  ): Promise<ProductCategory[]> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: DepartmentCategory.productCategory(id: ${category.id})`,
    );

    const productCategories =
      await context.loaders.productCategoriesByCategory.load(category.id);

    // Prime the translation cache for all product categories
    if (productCategories.length > 0) {
      const productCategoryIds = productCategories.map((pc) => pc.id);
      await context.productCategoryRepository.primeTranslations(
        context.loaders.productCategoryTranslation,
        productCategoryIds,
        language,
      );
    }

    return productCategories;
  }
}
