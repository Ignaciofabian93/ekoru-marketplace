import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminProductService } from './admin-product.service';
import { AdminProductResolver } from './resolvers';

/**
 * Admin Product Module
 *
 * Platform-admin CRUD surface over the marketplace Product table: raw paginated
 * reads (whole catalog, inactive/soft-deleted included), bulk upserts for XLSX
 * import / row-by-row editing, and a hard delete. Sibling of AdminCatalogModule;
 * reuses its shared `BulkUpsertResult` GraphQL type.
 */
@Module({
  imports: [PrismaModule],
  providers: [AdminProductService, AdminProductResolver],
  exports: [AdminProductService],
})
export class AdminProductModule {}
