import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminImpactService } from './admin-impact.service';
import { AdminImpactResolver } from './resolvers';

/**
 * Admin Impact Module
 *
 * Platform-admin CRUD surface over the marketplace impact tables (material
 * impact estimates, water & CO2 impact messages and their translations): raw
 * paginated reads, bulk upserts for XLSX import / row-by-row editing, and
 * per-row deletes. Sibling of AdminCatalogModule; reuses its shared
 * `BulkUpsertResult` GraphQL type.
 */
@Module({
  imports: [PrismaModule],
  providers: [AdminImpactService, AdminImpactResolver],
  exports: [AdminImpactService],
})
export class AdminImpactModule {}
