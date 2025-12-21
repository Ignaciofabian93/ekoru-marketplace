import { Module } from '@nestjs/common';
import { MarketplaceCatalogService } from './catalog.service';
import { MarketplaceCatalogResolver } from './catalog.resolver';

@Module({
  providers: [MarketplaceCatalogService, MarketplaceCatalogResolver],
  exports: [MarketplaceCatalogService],
})
export class MarketplaceCatalogModule {}
