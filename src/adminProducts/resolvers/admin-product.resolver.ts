import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators';
// Reuse the shared bulk-result type from adminCatalog — redefining the
// `BulkUpsertResult` ObjectType would collide in the federated schema.
import { BulkUpsertResultEntity } from '../../adminCatalog/entities';
import { RawProductConnectionEntity } from '../entities';
import { RawProductListArgs, ProductUpsertRowInput } from '../dto';
import { AdminProductService } from '../admin-product.service';

/**
 * Admin Product GraphQL Resolver
 *
 * Platform-admin surface over the marketplace Product table. Every operation
 * requires the x-admin-id header set by the gateway. `rawProducts` returns the
 * whole catalog (inactive / soft-deleted included); the bulk upsert is shared
 * by the XLSX import and the row-by-row edit form, plus a hard delete.
 */
@Resolver()
export class AdminProductResolver {
  private readonly logger = new Logger(AdminProductResolver.name);

  constructor(private readonly adminProductService: AdminProductService) {}

  @Query(() => RawProductConnectionEntity, {
    name: 'rawProducts',
    description:
      'Paginated marketplace products exactly as stored, inactive and ' +
      'soft-deleted included. Optional productCategoryId / sellerId / deleted ' +
      'filters. Admins only.',
  })
  async getRawProducts(
    @Args()
    {
      id,
      page,
      pageSize,
      search,
      productCategoryId,
      sellerId,
      deleted,
    }: RawProductListArgs,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Query: rawProducts(page: ${page})`);
    return this.adminProductService.getRawProducts({
      adminId,
      id,
      page,
      pageSize,
      search,
      productCategoryId,
      sellerId,
      deleted,
    });
  }

  @Mutation(() => BulkUpsertResultEntity, {
    description:
      'Creates (rows without id) or updates (rows with id) marketplace ' +
      'products. Setting productCategoryId re-parents a product. Admins only.',
  })
  async bulkUpsertProducts(
    @Args('rows', { type: () => [ProductUpsertRowInput] })
    rows: ProductUpsertRowInput[],
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: bulkUpsertProducts(${rows.length} rows)`);
    return this.adminProductService.bulkUpsertProducts({ adminId, rows });
  }

  @Mutation(() => Boolean, {
    description:
      'Hard-deletes a marketplace product. Fails while order items, exchanges ' +
      'or chats reference it. Admins only.',
  })
  async deleteProduct(
    @Args('id', { type: () => Int }) id: number,
    @CurrentAdmin() adminId?: string,
  ) {
    this.logger.debug(`Mutation: deleteProduct(${id})`);
    return this.adminProductService.deleteProduct({ adminId, id });
  }
}
