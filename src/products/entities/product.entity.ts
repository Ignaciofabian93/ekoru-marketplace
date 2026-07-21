import { ObjectType, Field, Int, ID, Directive } from '@nestjs/graphql';
import { Badge, ProductCondition } from '@prisma/client';
import { ProductCategoryEntity } from '../../productCategories/entities/product-category.entity';
import { EnvironmentalImpactEntity } from './environmental-impact.entity';

/**
 * GraphQL Seller Entity Reference
 *
 * This is an external entity owned by the users subgraph.
 * We only reference it by its key field for federation.
 */
@ObjectType('Seller')
@Directive('@key(fields: "id")')
export class SellerEntity {
  @Field(() => ID, { description: 'Seller unique identifier' })
  id!: string;
}

/**
 * GraphQL Product Entity
 *
 * Represents a marketplace product listing.
 */
@ObjectType('Product')
@Directive('@key(fields: "id")')
export class ProductEntity {
  @Field(() => Int, { description: 'Unique product identifier' })
  id!: number;

  @Field(() => String, { description: 'Product name' })
  name!: string;

  @Field(() => String, { description: 'Product description' })
  description!: string;

  @Field(() => String, { nullable: true, description: 'Product color' })
  color?: string;

  @Field(() => [String], { description: 'Product image URLs' })
  images!: string[];

  @Field(() => String, { description: 'Product brand' })
  brand!: string;

  @Field(() => Int, { description: 'Product price' })
  price!: number;

  @Field(() => Int, { description: 'Product category ID' })
  productCategoryId!: number;

  @Field(() => [Badge], { description: 'Product badges' })
  badges!: Badge[];

  @Field(() => [String], { description: 'Product interest tags' })
  interests!: string[];

  @Field(() => ProductCondition, { description: 'Product condition' })
  condition!: ProductCondition;

  @Field(() => String, { nullable: true, description: 'Condition description' })
  conditionDescription?: string;

  @Field(() => Boolean, { description: 'Whether product is active' })
  isActive!: boolean;

  @Field(() => Boolean, { description: 'Whether product is exchangeable' })
  isExchangeable!: boolean;

  @Field(() => String, { description: 'Seller ID' })
  sellerId!: string;

  @Field(() => Int, { description: 'Number of views' })
  viewCount!: number;

  @Field(() => Int, { description: 'Number of likes/favorites' })
  likesCount!: number;

  @Field(() => Date, { description: 'Creation timestamp' })
  createdAt!: Date;

  @Field(() => Date, { description: 'Last update timestamp' })
  updatedAt!: Date;

  @Field(() => Date, {
    nullable: true,
    description: 'Deletion timestamp (soft delete)',
  })
  deletedAt?: Date;

  // Relations
  @Field(() => ProductCategoryEntity, {
    nullable: true,
    description: 'Product category details',
  })
  productCategory?: ProductCategoryEntity;

  @Field(() => SellerEntity, {
    nullable: true,
    description: 'Seller who owns this product',
  })
  seller?: SellerEntity;

  @Field(() => EnvironmentalImpactEntity, {
    nullable: true,
    description:
      'Environmental impact estimate based on product category materials',
  })
  environmentalImpact?: EnvironmentalImpactEntity;
}
