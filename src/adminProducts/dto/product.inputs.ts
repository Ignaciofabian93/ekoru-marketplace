import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Badge, ProductCondition } from '../../graphql/enums';

/**
 * Admin marketplace-product inputs.
 *
 * The bulk upsert follows the shared catalog contract:
 * - `id` present → update that row (only the provided fields change)
 * - no `id`      → create (name/description/brand/price/sellerId/productCategoryId required)
 *
 * Omitted fields are left untouched on update; explicit `null` clears a
 * nullable column. Engagement metrics, timestamps and `deletedAt` are not
 * editable here.
 */

@ArgsType()
export class RawProductListArgs {
  @Field(() => Int, {
    nullable: true,
    description: 'Fetch a single row by id (edit screen)',
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Int, { defaultValue: 1, description: 'Page number (1-based)' })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 50, description: 'Items per page' })
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize: number;

  @Field(() => String, {
    nullable: true,
    description: 'Filters products whose name contains this text',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Filter by product category',
  })
  @IsOptional()
  @IsInt()
  productCategoryId?: number;

  @Field(() => String, { nullable: true, description: 'Filter by seller' })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => Boolean, {
    nullable: true,
    description:
      'true → only soft-deleted; false → only live; omitted → all (default)',
  })
  @IsOptional()
  @IsBoolean()
  deleted?: boolean;
}

@InputType()
export class ProductUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  color?: string | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  images?: string[];

  @Field(() => String, {
    nullable: true,
    description: 'Required when creating (no id).',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field(() => Int, { nullable: true, description: 'Price (integer units)' })
  @IsOptional()
  @IsInt()
  price?: number;

  @Field(() => Int, {
    nullable: true,
    description:
      'Parent product category. Required when creating; on update it re-parents.',
  })
  @IsOptional()
  @IsInt()
  productCategoryId?: number;

  @Field(() => [Badge], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Badge, { each: true })
  badges?: Badge[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  interests?: string[];

  @Field(() => ProductCondition, { nullable: true })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @Field(() => String, { nullable: true })
  @IsOptional()
  conditionDescription?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isExchangeable?: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Owner seller. Required when creating (no id).',
  })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredUntil?: Date | null;
}
