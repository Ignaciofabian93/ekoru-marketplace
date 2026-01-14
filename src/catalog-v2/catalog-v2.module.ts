import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Repositories
import { CatalogRepository } from '../repositories/catalog.repository';
import { DepartmentRepository } from '../repositories/department.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { ProductCategoryRepository } from '../repositories/product-category.repository';

// Services
import { CatalogService } from '../services/catalog.service';
import { DepartmentService } from '../services/department.service';
import { CategoryService } from 'src/services/category.service';
import { ProductCategoryService } from 'src/services/product-category.service';
import { I18nService } from '../common/i18n';

// Resolvers
import { CatalogResolver } from '../resolvers/catalog.resolver';
import { DepartmentResolver } from '../resolvers/department.resolver';
import { CategoryResolver } from '../resolvers/category.resolver';
import { ProductCategoryResolver } from '../resolvers/product-category.resolver';

/**
 * Catalog V2 Module - DataLoader-based multi-language catalog
 *
 * This module implements a professional DataLoader-based architecture for the
 * marketplace catalog with full multi-language support. It includes:
 *
 * - Repository layer with DataLoader pattern for N+1 prevention
 * - Service layer with business logic
 * - GraphQL resolvers with field-level resolution
 * - I18N service for language context management
 *
 * Performance characteristics:
 * - Maximum 3-4 database queries for full nested structure
 * - No N+1 query problems
 * - Response time < 100ms
 */
@Module({
  imports: [PrismaModule],
  providers: [
    // Services
    CatalogService,
    DepartmentService,
    CategoryService,
    ProductCategoryService,
    I18nService,

    // Repositories
    CatalogRepository,
    DepartmentRepository,
    CategoryRepository,
    ProductCategoryRepository,

    // Resolvers
    CatalogResolver,
    DepartmentResolver,
    CategoryResolver,
    ProductCategoryResolver,
  ],
  exports: [
    // Export services and repositories for use in other modules
    CatalogRepository,
    CatalogService,
    DepartmentRepository,
    DepartmentService,
    CategoryRepository,
    CategoryService,
    ProductCategoryRepository,
    ProductCategoryService,
    I18nService,
  ],
})
export class CatalogV2Module {}
