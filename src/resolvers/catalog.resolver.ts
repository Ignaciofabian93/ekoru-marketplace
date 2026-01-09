import { Resolver, Query, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { Language } from '@prisma/client';
import { CatalogService } from '../services/catalog.service';
import { MarketplaceCatalogItemEntity } from '../catalog-v2/entities';
import type { MarketplaceCatalog } from '../types/catalog';

/**
 * Catalog GraphQL Resolver
 *
 * This resolver handles queries for the marketplace catalog.
 * Returns the complete menu structure with departments, categories, and product categories.
 */
@Resolver()
export class CatalogResolver {
  private readonly logger = new Logger(CatalogResolver.name);

  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Query: Get marketplace catalog
   *
   * @example
   * query {
   *   getMarketplaceCatalog(language: ES) {
   *     id
   *     name
   *     href
   *     categories {
   *       id
   *       name
   *       href
   *       productCategories {
   *         id
   *         name
   *         href
   *       }
   *     }
   *   }
   * }
   */
  @Query(() => [MarketplaceCatalogItemEntity], {
    name: 'getMarketplaceCatalog',
    description: 'Get the complete marketplace catalog with nested categories',
  })
  async getMarketplaceCatalog(
    @Args('language', { type: () => Language, defaultValue: Language.ES })
    language: Language,
  ): Promise<MarketplaceCatalog> {
    this.logger.debug(`Query: getMarketplaceCatalog(${language})`);

    return this.catalogService.getMarketplaceCatalog(language);
  }
}
