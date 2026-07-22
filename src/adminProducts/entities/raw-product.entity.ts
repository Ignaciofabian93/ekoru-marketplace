import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Badge, ProductCondition } from '@prisma/client';
import { PageInfoEntity } from '../../products/entities/page-info.entity';

/**
 * Raw, admin-only view of a marketplace product.
 *
 * Unlike the web-facing `Product` entity, this returns rows exactly as stored —
 * **including inactive and soft-deleted products** (the admin read bypasses the
 * `isActive: true` / `deletedAt: null` web filter) — so the admin panel can
 * list, correct and export the whole catalog. Named `RawProduct` to stay
 * distinct from the federated `Product` entity. Engagement metrics and
 * `deletedAt` are read-only (not part of the bulk-upsert input).
 */
@ObjectType('RawProduct')
export class RawProductEntity {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => String, { nullable: true })
  color?: string | null;

  @Field(() => [String])
  images: string[];

  @Field(() => String)
  brand: string;

  @Field(() => Int)
  price: number;

  @Field(() => Int)
  productCategoryId: number;

  @Field(() => [Badge])
  badges: Badge[];

  @Field(() => [String])
  interests: string[];

  @Field(() => ProductCondition)
  condition: ProductCondition;

  @Field(() => String, { nullable: true })
  conditionDescription?: string | null;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Boolean)
  isExchangeable: boolean;

  @Field(() => String)
  sellerId: string;

  // Metrics (read-only)
  @Field(() => Int)
  viewCount: number;

  @Field(() => Int)
  likesCount: number;

  @Field(() => Date, { nullable: true })
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  featuredUntil?: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Soft-delete timestamp (null = live). Read-only.',
  })
  deletedAt?: Date | null;
}

@ObjectType('RawProductConnection')
export class RawProductConnectionEntity {
  @Field(() => [RawProductEntity])
  nodes: RawProductEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}
