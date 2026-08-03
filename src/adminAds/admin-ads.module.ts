import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAdsService } from './admin-ads.service';
import { AdminAdsResolver } from './resolvers';

/**
 * Admin Ads Module — platform-admin CRUD over the marketplace Advertisement
 * table: raw paginated reads, bulk upserts for XLSX import / row editing, and a
 * hard delete. Reuses AdminCatalogModule's shared `BulkUpsertResult` type.
 */
@Module({
  imports: [PrismaModule],
  providers: [AdminAdsService, AdminAdsResolver],
  exports: [AdminAdsService],
})
export class AdminAdsModule {}
