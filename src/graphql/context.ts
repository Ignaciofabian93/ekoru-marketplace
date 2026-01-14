import { Request, Response } from 'express';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { DepartmentRepository } from '../repositories/department.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductCategoryRepository } from '../repositories/product-category.repository';
import { DepartmentService } from '../services/department.service';
import { I18nService } from '../common/i18n';
import { GraphQLContext } from '../types';
import { CatalogRepository } from 'src/repositories/catalog.repository';

/**
 * GraphQL Context Factory
 *
 * This factory function creates a fresh GraphQL context for each request.
 * It initializes DataLoaders, services, and extracts metadata from the request.
 *
 * CRITICAL: DataLoaders MUST be created fresh per request to prevent stale cache
 * and ensure data consistency across requests.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {ModuleRef} moduleRef - NestJS module reference for dependency injection
 * @returns {GraphQLContext} The context object for this request
 */
export function createGraphQLContext(
  req: Request,
  res: Response,
  moduleRef: ModuleRef,
): GraphQLContext {
  // Resolve services and repositories from the NestJS DI container
  const prisma = moduleRef.get(PrismaService, { strict: false });
  const catalogRepository = moduleRef.get(CatalogRepository, {
    strict: false,
  });
  const departmentRepository = moduleRef.get(DepartmentRepository, {
    strict: false,
  });
  const categoryRepository = moduleRef.get(CategoryRepository, {
    strict: false,
  });
  const productCategoryRepository = moduleRef.get(ProductCategoryRepository, {
    strict: false,
  });

  const departmentService = moduleRef.get(DepartmentService, {
    strict: false,
  });
  const i18nService = moduleRef.get(I18nService, { strict: false });

  // Extract language from Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  const language = i18nService.parseAcceptLanguage(acceptLanguage);

  // Extract seller ID and token from headers
  const sellerId = req.headers['x-seller-id'] as string | undefined;
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Create fresh DataLoaders for this request
  const loaders = {
    marketplaceCatalog: catalogRepository.createTranslationLoader(),
    // Department loaders
    departmentTranslation: departmentRepository.createTranslationLoader(),
    departmentById: departmentRepository.createDepartmentLoader(),

    // Department Category loaders
    departmentCategoryTranslation: categoryRepository.createTranslationLoader(),
    departmentCategories: categoryRepository.createCategoryByDepartmentLoader(),

    // Product Category loaders
    productCategoryTranslation:
      productCategoryRepository.createTranslationLoader(),
    productCategoriesByCategory:
      productCategoryRepository.createProductCategoryByCategoryLoader(),
  };

  return {
    req,
    res,
    language,
    prisma,
    departmentService,
    i18nService,
    departmentRepository,
    categoryRepository,
    productCategoryRepository,
    loaders,
    sellerId,
    token,
  };
}

/**
 * Context factory wrapper for use in GraphQLModule configuration
 *
 * This function returns a context factory that can be used in the GraphQL module
 * configuration. It provides access to the NestJS ModuleRef for dependency injection.
 *
 * @example
 * GraphQLModule.forRoot({
 *   context: createContextFactory(moduleRef),
 * })
 */
export function createContextFactory(moduleRef: ModuleRef) {
  return ({ req, res }: { req: Request; res: Response }): GraphQLContext => {
    return createGraphQLContext(req, res, moduleRef);
  };
}
