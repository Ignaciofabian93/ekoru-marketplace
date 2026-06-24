import {
  Resolver,
  ResolveField,
  Parent,
  Context,
  Query,
  Int,
  Args,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import type {
  ProductCategory,
  ProductCategoryTranslation,
} from '../types/product-category';
import type { GraphQLContext } from '../types';
import {
  ProductCategoryEntity,
  ProductCategoryTranslationEntity,
} from '../catalog-v2/entities';
import { Language } from '../graphql/enums';
import { ProductCategoryService } from '../services/product-category.service';

/**
 * Product Category GraphQL Resolver
 *
 * This resolver handles field resolutions for product categories.
 * It uses DataLoaders from the context to efficiently load translations.
 */
@Resolver(() => ProductCategoryEntity)
export class ProductCategoryResolver {
  private readonly logger = new Logger(ProductCategoryResolver.name);

  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  /**
   * Query: Get department by slug
   *
   * @example
   * query {
   *   getProductCategoryBySlug(slug: "led-grande", language: ES) {
   *     id
   *     translation { name slug }
   *   }
   * }
   */
  @Query(() => ProductCategoryEntity, { nullable: true })
  async getProductCategoryBySlug(
    @Args('slug') slug: string,
    @Args('language', { type: () => Language, defaultValue: Language.ES })
    language: Language,
    @Context() context: GraphQLContext,
  ): Promise<ProductCategory> {
    this.logger.debug(`Query: getProductCategoryBySlug(${slug}, ${language})`);

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    return this.productCategoryService.getProductCategoryBySlug({
      slug,
      language,
    });
  }

  /**
   * Query: Get all department categories with pagination
   *
   * @example
   * query {
   *   getProductCategories(limit: 10, offset: 0, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [ProductCategoryEntity])
  async getProductCategories(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('language', { type: () => Language, defaultValue: Language.ES })
    language: Language,
    @Context() context: GraphQLContext,
  ): Promise<ProductCategory[]> {
    this.logger.debug(
      `Query: getProductCategories(limit: ${limit}, offset: ${offset}, language: ${language})`,
    );

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    const productCategories =
      await this.productCategoryService.getProductCategories({
        limit,
        offset,
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
