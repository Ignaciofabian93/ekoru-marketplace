import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { ProductCategoryRepository } from './product-category.repository';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryResolver } from './resolvers';
import { I18nProductCategoryService } from './i18n';

/**
 * Product Categories Module
 *
 * Self-contained subdomain module for product categories:
 * - Repository layer with DataLoader pattern for N+1 prevention
 * - Service layer with business logic (by id for admin, by slug for web)
 * - GraphQL resolver with field-level resolution
 * - Subdomain-scoped I18N service
 */
@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [
    I18nProductCategoryService,
    ProductCategoryRepository,
    ProductCategoryService,
    ProductCategoryResolver,
  ],
  exports: [
    I18nProductCategoryService,
    ProductCategoryRepository,
    ProductCategoryService,
  ],
})
export class ProductCategoriesModule {}
