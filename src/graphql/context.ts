import DataLoader from 'dataloader';
import { Request, Response } from 'express';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { DepartmentRepository } from '../repositories/department.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductCategoryRepository } from '../repositories/product-category.repository';
import { DepartmentService } from '../services/department.service';
import { I18nService } from '../common/i18n';
import { GraphQLContext } from '../types';

/**
 * GraphQL Context Factory
 *
 * Creates a fresh context object for each request. Language is resolved once
 * from the Accept-Language header and stored in context.language. DataLoaders
 * are created fresh per request to prevent stale cache across requests.
 */
export function createGraphQLContext(
  req: Request,
  res: Response,
  moduleRef: ModuleRef,
): GraphQLContext {
  const prisma = moduleRef.get(PrismaService, { strict: false });
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

  // Parse Accept-Language header once per request
  const i18nService = moduleRef.get(I18nService, { strict: false });
  const language = i18nService.parseAcceptLanguage(
    req.headers['accept-language'],
  );

  const sellerId = req.headers['x-seller-id'] as string | undefined;
  const adminId = req.headers['x-admin-id'] as string | undefined;
  const token = req.headers.authorization?.replace('Bearer ', '');

  // DataLoaders MUST be fresh per request to prevent stale cache
  const loaders = {
    departmentTranslation: departmentRepository.createTranslationLoader(),
    departmentById: departmentRepository.createDepartmentLoader(),
    departmentCategoryTranslation: categoryRepository.createTranslationLoader(),
    departmentCategories: categoryRepository.createCategoryByDepartmentLoader(),
    productCategoryTranslation:
      productCategoryRepository.createTranslationLoader(),
    productCategoriesByCategory:
      productCategoryRepository.createProductCategoryByCategoryLoader(),

    // Batches "is this product favorited by the current seller?" lookups so
    // catalog grids resolve `isLiked` without an N+1. Anonymous → all false.
    productLikedByMe: new DataLoader<number, boolean>(async (productIds) => {
      if (!sellerId) return productIds.map(() => false);
      const likes = await prisma.marketplaceProductLike.findMany({
        where: { sellerId, productId: { in: [...productIds] } },
        select: { productId: true },
      });
      const liked = new Set(likes.map((l) => l.productId));
      return productIds.map((id) => liked.has(id));
    }),
  };

  return {
    req,
    res,
    language,
    prisma,
    departmentService,
    departmentRepository,
    categoryRepository,
    productCategoryRepository,
    loaders,
    sellerId,
    adminId,
    token,
  };
}

/**
 * Context factory wrapper for GraphQLModule configuration.
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
