import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Context,
  Args,
  Int,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import type {
  DepartmentCategory,
  DepartmentCategoryTranslation,
} from '../types/category';
import type { ProductCategory } from '../types/product-category';
import type { GraphQLContext } from '../types';
import {
  DepartmentCategoryEntity,
  DepartmentCategoryTranslationEntity,
  ProductCategoryEntity,
} from '../catalog-v2/entities';
import { CategoryService } from '../services/category.service';
import { Language } from '@prisma/client';

/**
 * Department Category GraphQL Resolver
 *
 * This resolver handles field resolutions for department categories.
 * It uses DataLoaders from the context to efficiently load translations and related data.
 */
@Resolver(() => DepartmentCategoryEntity)
export class CategoryResolver {
  private readonly logger = new Logger(CategoryResolver.name);

  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Query: Get departmentCategory by slug
   *
   * @example
   * query {
   *   getDepartmentCategoryBySlug(slug: "television", language: ES) {
   *     id
   *     translation { name slug }
   *   }
   * }
   */
  @Query(() => DepartmentCategoryEntity, { nullable: true })
  async getDepartmentCategoryBySlug(
    @Args('slug') slug: string,
    @Args('language', { type: () => Language }) language: Language,
    @Context() context: GraphQLContext,
  ): Promise<DepartmentCategory> {
    this.logger.debug(
      `Query: getDepartmentCategoryBySlug(${slug}, ${language})`,
    );

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    return this.categoryService.getDepartmentCategoryBySlug(slug, language);
  }

  /**
   * Query: Get all department categories with pagination
   *
   * @example
   * query {
   *   getDepartmentCategories(limit: 10, offset: 0, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [DepartmentCategoryEntity])
  async getDepartmentCategories(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('language', { type: () => Language, defaultValue: Language.ES })
    language: Language,
    @Context() context: GraphQLContext,
  ): Promise<DepartmentCategory[]> {
    this.logger.debug(
      `Query: getDepartmentCategories(limit: ${limit}, offset: ${offset}, language: ${language})`,
    );

    // Override context language so field resolvers use the same language the client requested.
    context.language = language;

    const categories = await this.categoryService.getDepartmentCategories(
      limit,
      offset,
      language,
    );

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
