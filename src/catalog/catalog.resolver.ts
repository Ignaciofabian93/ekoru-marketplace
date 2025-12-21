import { Resolver, Query } from '@nestjs/graphql';
import { MarketplaceCatalogService } from './catalog.service';
import { Department } from './entities';

@Resolver()
export class MarketplaceCatalogResolver {
  constructor(
    private readonly marketplaceCatalogService: MarketplaceCatalogService,
  ) {}

  @Query(() => [Department], { nullable: true, name: 'marketplaceCatalog' })
  async getMarketplaceCatalog() {
    return this.marketplaceCatalogService.getMarketplaceCatalog();
  }
}
