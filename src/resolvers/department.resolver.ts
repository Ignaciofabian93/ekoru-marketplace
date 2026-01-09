import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Args,
  Context,
  Int,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { Language } from '@prisma/client';
import type { Department } from '../types/department';
import type { DepartmentCategory } from '../types/category';
import type { DepartmentTranslation } from '../types/department';
import type { GraphQLContext } from '../types';
import { DepartmentService } from '../services/department.service';
import {
  DepartmentEntity,
  DepartmentTranslationEntity,
  DepartmentCategoryEntity,
} from '../catalog-v2/entities';

/**
 * Department GraphQL Resolver
 *
 * This resolver handles all GraphQL queries and field resolutions for departments.
 * It uses DataLoaders from the context to efficiently load translations and related data.
 */
@Resolver(() => DepartmentEntity)
export class DepartmentResolver {
  private readonly logger = new Logger(DepartmentResolver.name);

  constructor(private readonly departmentService: DepartmentService) {}

  /**
   * Query: Get department by slug
   *
   * @example
   * query {
   *   getDepartmentBySlug(slug: "tecnologia", language: ES) {
   *     id
   *     translation { name slug }
   *   }
   * }
   */
  @Query(() => DepartmentEntity, { nullable: true })
  async getDepartmentBySlug(
    @Args('slug') slug: string,
    @Args('language', { type: () => Language }) language: Language,
    @Context() context: GraphQLContext,
  ): Promise<Department> {
    this.logger.debug(`Query: getDepartmentBySlug(${slug}, ${language})`);

    // Set language in context for this request
    context.i18nService.setCurrentLanguage(language);

    return this.departmentService.getDepartmentBySlug(slug, language);
  }

  /**
   * Query: Get all departments with pagination
   *
   * @example
   * query {
   *   getDepartments(limit: 10, offset: 0, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [DepartmentEntity])
  async getDepartments(
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @Args('language', { type: () => Language, defaultValue: Language.ES })
    language: Language,
    @Context() context: GraphQLContext,
  ): Promise<Department[]> {
    this.logger.debug(
      `Query: getDepartments(limit: ${limit}, offset: ${offset}, language: ${language})`,
    );

    // Set language in context for this request
    context.i18nService.setCurrentLanguage(language);

    const departments = await this.departmentService.getDepartments(
      limit,
      offset,
      language,
    );

    // Prime the translation cache for all departments
    if (departments.length > 0) {
      const departmentIds = departments.map((d) => d.id);
      await context.departmentRepository.primeTranslations(
        context.loaders.departmentTranslation,
        departmentIds,
        language,
      );
    }

    return departments;
  }

  /**
   * Field Resolver: translation
   *
   * Resolves the translation field for a department using DataLoader.
   * Returns a SINGLE translation object based on the current language.
   */
  @ResolveField(() => DepartmentTranslationEntity, { nullable: true })
  async translation(
    @Parent() department: Department,
    @Context() context: GraphQLContext,
  ): Promise<DepartmentTranslation | null> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: Department.translation(id: ${department.id}, language: ${language})`,
    );

    return context.departmentRepository.getTranslation(
      context.loaders.departmentTranslation,
      department.id,
      language,
    );
  }

  /**
   * Field Resolver: departmentCategory
   *
   * Resolves the departmentCategory field for a department using DataLoader.
   * Returns an array of categories for this department.
   */
  @ResolveField(() => [DepartmentCategoryEntity])
  async departmentCategory(
    @Parent() department: Department,
    @Context() context: GraphQLContext,
  ): Promise<DepartmentCategory[]> {
    const language = context.language;

    this.logger.debug(
      `ResolveField: Department.departmentCategory(id: ${department.id})`,
    );

    const categories = await context.loaders.departmentCategories.load(
      department.id,
    );

    // Prime the translation cache for all categories
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
}
