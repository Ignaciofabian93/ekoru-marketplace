import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogRepository } from '../repositories/catalog.repository';
import { CatalogService } from '../services/catalog.service';
import { CatalogResolver } from '../resolvers/catalog.resolver';
import { I18nService } from '../common/i18n';

/**
 * Catalog Module - Marketplace catalog (web menu) queries only
 *
 * This module is concerned exclusively with catalog queries such as
 * getMarketplaceCatalog, which returns the list of departments with nested
 * subcategories used by the web menu.
 *
 * Department, department category and product category queries live in their
 * own subdomain modules (DepartmentsModule, DepartmentCategoriesModule,
 * ProductCategoriesModule).
 */
@Module({
  imports: [PrismaModule],
  providers: [
    // I18N (also used by the GraphQL context factory to parse Accept-Language)
    I18nService,

    // Catalog
    CatalogService,
    CatalogRepository,
    CatalogResolver,
  ],
  exports: [I18nService, CatalogService, CatalogRepository],
})
export class CatalogV2Module {}
