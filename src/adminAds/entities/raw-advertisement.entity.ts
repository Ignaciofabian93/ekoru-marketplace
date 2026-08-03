import { ObjectType, Field, Int } from '@nestjs/graphql';
import { AdvertisementType } from '../../graphql/enums';
import { PageInfoEntity } from '../../products/entities/page-info.entity';

/**
 * Raw, admin-only view of a marketplace advertisement.
 *
 * Returns rows exactly as stored — inactive included, no seller scoping — so
 * the admin panel can list, correct and export every ad. Named `RawAdvertisement`
 * to stay distinct from any web entity. Timestamps are read-only. The optional
 * productId / storeProductId / serviceId point at the promoted item (in other
 * subgraphs), edited here as plain ids.
 */
@ObjectType('RawAdvertisement')
export class RawAdvertisementEntity {
  @Field(() => Int)
  id: number;

  @Field(() => AdvertisementType)
  adType: AdvertisementType;

  @Field(() => Int)
  price: number;

  @Field(() => String)
  content: string;

  @Field(() => Date)
  startDate: Date;

  @Field(() => Date)
  endDate: Date;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => String)
  sellerId: string;

  @Field(() => Int, { nullable: true })
  productId?: number | null;

  @Field(() => Int, { nullable: true })
  storeProductId?: number | null;

  @Field(() => Int, { nullable: true })
  serviceId?: number | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType('RawAdvertisementConnection')
export class RawAdvertisementConnectionEntity {
  @Field(() => [RawAdvertisementEntity])
  nodes: RawAdvertisementEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}
