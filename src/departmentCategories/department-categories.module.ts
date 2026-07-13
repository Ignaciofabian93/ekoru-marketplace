import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { DepartmentCategoryRepository } from './department-category.repository';
import { DepartmentCategoryService } from './department-category.service';
import { DepartmentCategoryResolver } from './resolvers';
import { I18nDepartmentCategoryService } from './i18n';

/**
 * Department Categories Module
 *
 * Self-contained subdomain module for department categories:
 * - Repository layer with DataLoader pattern for N+1 prevention
 * - Service layer with business logic (by id for admin, by slug for web)
 * - GraphQL resolver with field-level resolution
 * - Subdomain-scoped I18N service
 */
@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [
    I18nDepartmentCategoryService,
    DepartmentCategoryRepository,
    DepartmentCategoryService,
    DepartmentCategoryResolver,
  ],
  exports: [
    I18nDepartmentCategoryService,
    DepartmentCategoryRepository,
    DepartmentCategoryService,
  ],
})
export class DepartmentCategoriesModule {}
