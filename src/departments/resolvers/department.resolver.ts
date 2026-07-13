import {
  Resolver,
  Query,
  ResolveField,
  ResolveReference,
  Parent,
  Args,
  Context,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import type { Department, DepartmentTranslation } from '../../types/department';
import type { DepartmentCategory } from '../../types/category';
import type { GraphQLContext } from '../../types';
import {
  DepartmentEntity,
  DepartmentTranslationEntity,
  DepartmentProductsEntity,
} from '../entities';
import { DepartmentCategoryEntity } from '../../departmentCategories/entities';
import {
  GetDepartmentsArgs,
  GetDepartmentByIdArgs,
  GetDepartmentBySlugArgs,
  GetDepartmentProductsByIdArgs,
  GetDepartmentProductsBySlugArgs,
} from '../dto';
import { DepartmentService } from '../department.service';
import { CurrentSeller } from '../../common/decorators';

/**
 * Department GraphQL Resolver
 *
 * This resolver handles all GraphQL queries and field resolutions for departments.
 * It uses DataLoaders from the context to efficiently load translations and related data.
 *
 * Lookup conventions:
 * - by slug → web browsing (e.g. /technology)
 * - by id   → admin panel
 */
@Resolver(() => DepartmentEntity)
export class DepartmentResolver {
  private readonly logger = new Logger(DepartmentResolver.name);

  constructor(private readonly departmentService: DepartmentService) {}

  /**
   * Query: Get all departments with page-based pagination
   *
   * @example
   * query {
   *   getDepartments(page: 1, pageSize: 20, language: ES) {
   *     id
   *     translation { name }
   *   }
   * }
   */
  @Query(() => [DepartmentEntity])
  async getDepartments(
    @Args() { page, pageSize, language }: GetDepartmentsArgs,
    @Context() context: GraphQLContext,
  ): Promise<Department[]> {
    this.logger.debug(
      `Query: getDepartments(page: ${page}, pageSize: ${pageSize}, language: ${language})`,
    );

    // Override context language so field resolvers (translation, departmentCategory)
    // use the same language the client explicitly requested.
    context.language = language;

    const departments = await this.departmentService.getDepartments({
      page,
      pageSize,
      language,
    });

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
   * Query: Get a single department by ID (admin panel)
   *
   * @example
   * query {
   *   getDepartmentById(id: 1, language: ES) {
   *     id
   *     translation { name }
   *     departmentCategory { id translation { name } }
   *   }
   * }
   */
  @Query(() => DepartmentEntity, { nullable: true })
  async getDepartmentById(
    @Args() { id, language }: GetDepartmentByIdArgs,
    @Context() context: GraphQLContext,
  ): Promise<Department> {
    this.logger.debug(`Query: getDepartmentById(${id}, ${language})`);

    context.language = language;

    return this.departmentService.getDepartmentById({ id, language });
  }

  /**
   * Query: Get a single department by slug (web browsing)
   *
   * @example
   * query {
   *   getDepartmentBySlug(slug: "technology", language: EN) {
   *     id
   *     translation { name }
   *     departmentCategory { id translation { name } }
   *   }
   * }
   */
  @Query(() => DepartmentEntity, { nullable: true })
  async getDepartmentBySlug(
    @Args() { slug, language }: GetDepartmentBySlugArgs,
    @Context() context: GraphQLContext,
  ): Promise<Department> {
    this.logger.debug(`Query: getDepartmentBySlug(${slug}, ${language})`);

    context.language = language;

    return this.departmentService.getDepartmentBySlug({ slug, language });
  }

  /**
   * Query: Get a department by ID along with its subcategories and the
   * paginated list of every product inside it (admin panel)
   *
   * @example
   * query {
   *   getDepartmentProductsById(id: 1, language: ES, page: 1, pageSize: 20) {
   *     department {
   *       id
   *       translation { name slug }
   *       departmentCategory { id translation { name } }
   *     }
   *     products {
   *       nodes { id name price }
   *       pageInfo { totalCount totalPages hasNextPage }
   *     }
   *   }
   * }
   */
  @Query(() => DepartmentProductsEntity, { nullable: true })
  async getDepartmentProductsById(
    @Args()
    {
      id,
      language,
      page,
      pageSize,
      filter,
      sort,
    }: GetDepartmentProductsByIdArgs,
    @Context() context: GraphQLContext,
    @CurrentSeller() currentSellerId?: string,
  ) {
    this.logger.debug(
      `Query: getDepartmentProductsById(${id}, ${language}, page: ${page}, pageSize: ${pageSize})`,
    );

    // Override context language so nested field resolvers (e.g. productCategory
    // translations) use the same language the client explicitly requested.
    context.language = language;

    return this.departmentService.getDepartmentProductsById({
      id,
      language,
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  /**
   * Query: Get a department by slug along with its subcategories and the
   * paginated list of every product inside it (web browsing)
   *
   * @example
   * query {
   *   getDepartmentProductsBySlug(slug: "technology", language: EN, page: 1, pageSize: 20) {
   *     department {
   *       id
   *       translation { name slug }
   *       departmentCategory { id translation { name } }
   *     }
   *     products {
   *       nodes { id name price }
   *       pageInfo { totalCount totalPages hasNextPage }
   *     }
   *   }
   * }
   */
  @Query(() => DepartmentProductsEntity, { nullable: true })
  async getDepartmentProductsBySlug(
    @Args()
    {
      slug,
      language,
      page,
      pageSize,
      filter,
      sort,
    }: GetDepartmentProductsBySlugArgs,
    @Context() context: GraphQLContext,
    @CurrentSeller() currentSellerId?: string,
  ) {
    this.logger.debug(
      `Query: getDepartmentProductsBySlug(${slug}, ${language}, page: ${page}, pageSize: ${pageSize})`,
    );

    // Override context language so nested field resolvers (e.g. productCategory
    // translations) use the same language the client explicitly requested.
    context.language = language;

    return this.departmentService.getDepartmentProductsBySlug({
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
   * Returns an array of categories (subcategories) for this department.
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

  /**
   * Reference resolver for Apollo Federation.
   * Allows other subgraphs to resolve a Department by ID.
   */
  @ResolveReference()
  async resolveReference(
    reference: { __typename: string; id: number },
    @Context() context: GraphQLContext,
  ): Promise<Department | null> {
    this.logger.debug(`ResolveReference: Department(id: ${reference.id})`);
    return context.loaders.departmentById.load(reference.id);
  }
}
