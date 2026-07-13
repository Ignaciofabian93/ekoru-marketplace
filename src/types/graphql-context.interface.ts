import DataLoader from 'dataloader';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { Language } from '@prisma/client';
import type { Department, DepartmentTranslation } from './department';
import type {
  DepartmentCategory,
  DepartmentCategoryTranslation,
} from './category';
import type {
  ProductCategory,
  ProductCategoryTranslation,
} from './product-category';
import { DepartmentRepository } from '../departments/department.repository';
import { DepartmentCategoryRepository } from '../departmentCategories/department-category.repository';
import { ProductCategoryRepository } from '../productCategories/product-category.repository';
import { DepartmentService } from '../departments/department.service';

/**
 * GraphQL Context Interface
 *
 * Per-request context available to all resolvers. Language is resolved once
 * from the Accept-Language header at context creation. Resolvers can override
 * context.language when the client supplies an explicit language argument so
 * that downstream field resolvers use a consistent language for the whole request.
 *
 * DataLoaders are created fresh per request to prevent stale cache across requests.
 */
export interface GraphQLContext {
  // Express Request/Response
  req: Request;
  res: Response;

  /**
   * Active language for this request.
   * Set from the Accept-Language header at context creation.
   * Resolvers may override this when the client passes an explicit language arg,
   * ensuring field resolvers below them use the same language.
   */
  language: Language;

  // Prisma Client
  prisma: PrismaService;

  // Services
  departmentService: DepartmentService;

  // Repositories (also expose DataLoader helpers)
  departmentRepository: DepartmentRepository;
  categoryRepository: DepartmentCategoryRepository;
  productCategoryRepository: ProductCategoryRepository;

  // DataLoaders - fresh per request
  loaders: {
    // Department loaders
    departmentTranslation: DataLoader<string, DepartmentTranslation | null>;
    departmentById: DataLoader<number, Department | null>;
    departmentCategories: DataLoader<number, DepartmentCategory[]>;

    // Department Category loaders
    departmentCategoryTranslation: DataLoader<
      string,
      DepartmentCategoryTranslation | null
    >;

    // Product Category loaders
    productCategoryTranslation: DataLoader<
      string,
      ProductCategoryTranslation | null
    >;
    productCategoriesByCategory: DataLoader<number, ProductCategory[]>;

    // Whether the current seller has favorited a product (keyed by productId).
    productLikedByMe: DataLoader<number, boolean>;
  };

  // Optional: Authenticated seller ID (from x-seller-id header)
  sellerId?: string;

  // Optional: Authenticated admin ID (from x-admin-id header)
  adminId?: string;

  // Optional: Auth token
  token?: string;
}

/**
 * Type guard to ensure context has all required properties
 */
export function isValidGraphQLContext(context: any): context is GraphQLContext {
  return (
    context &&
    typeof context === 'object' &&
    'loaders' in context &&
    'language' in context &&
    'prisma' in context
  );
}
