import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CurrentAdmin } from '../../common/decorators';
// Reuse the shared bulk-result type from adminCatalog — redefining the
// `BulkUpsertResult` ObjectType would collide in the federated schema.
import { BulkUpsertResultEntity } from '../../adminCatalog/entities';
import { RawAdvertisementConnectionEntity } from '../entities';
import { RawAdvertisementListArgs, AdvertisementUpsertRowInput } from '../dto';
import { AdminAdsService } from '../admin-ads.service';

/**
 * Platform-admin surface over the marketplace Advertisement table. Every
 * operation requires the x-admin-id header the gateway sets. `rawAdvertisements`
 * returns every ad (inactive included); the bulk upsert is shared by the XLSX
 * import and the row-by-row edit form, plus a hard delete.
 */
@Resolver()
export class AdminAdsResolver {
  constructor(private readonly adminAdsService: AdminAdsService) {}

  @Query(() => RawAdvertisementConnectionEntity, {
    name: 'rawAdvertisements',
    description:
      'Paginated, unprocessed advertisements (inactive included). Admins only.',
  })
  getRawAdvertisements(
    @Args()
    {
      id,
      page,
      pageSize,
      search,
      adType,
      sellerId,
      isActive,
    }: RawAdvertisementListArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.adminAdsService.getRawAdvertisements({
      adminId,
      id,
      page,
      pageSize,
      search,
      adType,
      sellerId,
      isActive,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Bulk create/update advertisements (rows with id update, without id create). Admins only.',
  })
  bulkUpsertAdvertisements(
    @Args('rows', { type: () => [AdvertisementUpsertRowInput] })
    rows: AdvertisementUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    return this.adminAdsService.bulkUpsertAdvertisements({ adminId, rows });
  }

  @Mutation(() => Boolean, {
    name: 'deleteAdvertisement',
    description: 'Hard-delete an advertisement. Admins only.',
  })
  deleteAdvertisement(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.adminAdsService.deleteAdvertisement({ adminId, id });
  }
}
