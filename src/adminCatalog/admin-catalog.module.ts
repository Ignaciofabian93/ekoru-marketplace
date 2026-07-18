import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminCatalogResolver } from './resolvers';

/**
 * Admin Catalog Module
 *
 * Platform-admin CRUD surface over the marketplace catalog tables
 * (departments, department categories, product categories and their
 * translations): raw paginated reads, bulk upserts for XLSX import /
 * row-by-row editing, and per-row deletes.
 *
 * Kept separate from the web-facing subdomain modules so the browsing
 * queries stay lean and the admin surface can grow independently.
 */
@Module({
  imports: [PrismaModule],
  providers: [AdminCatalogService, AdminCatalogResolver],
  exports: [AdminCatalogService],
})
export class AdminCatalogModule {}
