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
  ProductCategory,
  ProductCategoryTranslation,
} from '../../types/product-category';
import type { GraphQLContext } from '../../types';
import {
  ProductCategoryEntity,
  ProductCategoryTranslationEntity,
  ProductCategoryProductsEntity,
} from '../entities';
import {
  GetProductCategoriesArgs,
  GetProductCategoryByIdArgs,
  GetProductCategoryBySlugArgs,
  GetProductCategoryProductsBySlugArgs,
} from '../dto';
import { ProductCategoryService } from '../product-category.service';
import { CurrentSeller } from '../../common/decorators';

/**
 * Product Category GraphQL Resolver
 *
 * This resolver handles queries and field resolutions for product categories.
 * It uses DataLoaders from the context to efficiently load translations.
 */
@Resolver(() => ProductCategoryEntity)
export class ProductCategoryResolver {
  private readonly logger = new Logger(ProductCategoryResolver.name);

  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  /**
   * Query: Get all product categories with page-based pagination
   *
   * @example
   * query {
   *   getProductCategories(page: 1, pageSize: 20, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [ProductCategoryEntity])
  async getProductCategories(
    @Args() { page, pageSize, language }: GetProductCategoriesArgs,
    @Context() context: GraphQLContext,
  ): Promise<ProductCategory[]> {
    this.logger.debug(
      `Query: getProductCategories(page: ${page}, pageSize: ${pageSize}, language: ${language})`,
    );

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    const productCategories =
      await this.productCategoryService.getProductCategories({
        page,
        pageSize,
        language,
      });

    if (productCategories.length > 0) {
      const categoryIds = productCategories.map((cat) => cat.id);

      // Prime the translation cache for all categories
      await context.productCategoryRepository.primeTranslations(
        context.loaders.productCategoryTranslation,
        categoryIds,
        language,
      );
    }

    return productCategories;
  }

  /**
   * Query: Get a single product category by ID (admin panel)
   */
  @Query(() => ProductCategoryEntity, { nullable: true })
  async getProductCategoryById(
    @Args() { id, language }: GetProductCategoryByIdArgs,
    @Context() context: GraphQLContext,
  ): Promise<ProductCategory> {
    this.logger.debug(`Query: getProductCategoryById(${id}, ${language})`);

    context.language = language;

    return this.productCategoryService.getProductCategoryById({
      id,
      language,
    });
  }

  /**
   * Query: Get a single product category by slug (web browsing)
   */
  @Query(() => ProductCategoryEntity, { nullable: true })
  async getProductCategoryBySlug(
    @Args() { slug, language }: GetProductCategoryBySlugArgs,
    @Context() context: GraphQLContext,
  ): Promise<ProductCategory> {
    this.logger.debug(`Query: getProductCategoryBySlug(${slug}, ${language})`);

    context.language = language;

    return this.productCategoryService.getProductCategoryBySlug({
      slug,
      language,
    });
  }

  /**
   * Query: Get a product category by slug along with its paginated products
   * (web browsing). This is the most focused browsing level.
   *
   * On the first load select the full payload; when paginating select only
   * `products` so the category data is not re-resolved.
   *
   * @example
   * query {
   *   getProductCategoryProductsBySlug(slug: "led-grande", language: ES, page: 1, pageSize: 12) {
   *     productCategory {
   *       id
   *       translation { name slug }
   *     }
   *     products {
   *       nodes { id name price }
   *       pageInfo { totalCount totalPages hasNextPage }
   *     }
   *   }
   * }
   */
  @Query(() => ProductCategoryProductsEntity, { nullable: true })
  async getProductCategoryProductsBySlug(
    @Args()
    {
      slug,
      language,
      page,
      pageSize,
      filter,
      sort,
    }: GetProductCategoryProductsBySlugArgs,
    @Context() context: GraphQLContext,
    @CurrentSeller() currentSellerId?: string,
  ) {
    this.logger.debug(
      `Query: getProductCategoryProductsBySlug(${slug}, ${language}, page: ${page}, pageSize: ${pageSize})`,
    );

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    return this.productCategoryService.getProductCategoryProductsBySlug({
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
   * Resolves the translation field for a product category using DataLoader.
   * Returns a SINGLE translation object based on the current language.
   */
  @ResolveField(() => ProductCategoryTranslationEntity, { nullable: true })
  async translation(
    @Parent() productCategory: ProductCategory,
    @Context() context: GraphQLContext,
  ): Promise<ProductCategoryTranslation | null> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: ProductCategory.translation(id: ${productCategory.id}, language: ${language})`,
    );

    return context.productCategoryRepository.getTranslation(
      context.loaders.productCategoryTranslation,
      productCategory.id,
      language,
    );
  }
}
