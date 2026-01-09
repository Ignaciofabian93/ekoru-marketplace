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
import { DepartmentRepository } from '../repositories/department.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductCategoryRepository } from '../repositories/product-category.repository';
import { DepartmentService } from '../services/department.service';
import { I18nService } from '../common/i18n';

/**
 * GraphQL Context Interface
 *
 * This interface defines the context object that is available to all resolvers.
 * The context is created per request and includes:
 * - DataLoaders for batch loading and caching
 * - Service instances
 * - Repository instances
 * - Request metadata (language, user, etc.)
 */
export interface GraphQLContext {
  // Express Request/Response
  req: Request;
  res: Response;

  // Current language for this request
  language: Language;

  // Prisma Client
  prisma: PrismaService;

  // Services
  departmentService: DepartmentService;
  i18nService: I18nService;

  // Repositories
  departmentRepository: DepartmentRepository;
  categoryRepository: CategoryRepository;
  productCategoryRepository: ProductCategoryRepository;

  // DataLoaders - Fresh per request to prevent stale data
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
  };

  // Optional: Authenticated seller ID (from x-seller-id header)
  sellerId?: string;

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
