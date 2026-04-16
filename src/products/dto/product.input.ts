import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Badge, ProductCondition } from '@prisma/client';

/**
 * GraphQL Input for filtering products
 */
@InputType('ProductFilterInput')
export class ProductFilterInput {
  @Field(() => String, {
    nullable: true,
    description: 'Filter by product name',
  })
  name?: string;

  @Field(() => Int, { nullable: true, description: 'Minimum price filter' })
  minPrice?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum price filter' })
  maxPrice?: number;

  @Field(() => ProductCondition, {
    nullable: true,
    description: 'Filter by product condition',
  })
  condition?: ProductCondition;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Filter by exchangeable status',
  })
  isExchangeable?: boolean;

  @Field(() => [Badge], { nullable: true, description: 'Filter by badges' })
  badges?: Badge[];
}

/**
 * GraphQL Input for sorting products
 */
@InputType('ProductSortInput')
export class ProductSortInput {
  @Field(() => String, {
    description: 'Field to sort by (e.g., price, createdAt, name)',
  })
  @IsOptional()
  field?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Sort order: asc or desc',
    defaultValue: 'desc',
  })
  order?: 'asc' | 'desc';
}

/**
 * GraphQL Input for adding a new product
 */
@InputType('AddProductInput')
export class AddProductInput {
  @Field(() => String, { description: 'Product name' })
  @IsString()
  name!: string;

  @Field(() => String, { description: 'Product description' })
  @IsString()
  description!: string;

  @Field(() => String, { nullable: true, description: 'Product color' })
  @IsOptional()
  @IsString()
  color?: string;

  @Field(() => [String], { description: 'Product image URLs' })
  @IsArray()
  images!: string[];

  @Field(() => String, { description: 'Product brand' })
  @IsString()
  brand!: string;

  @Field(() => Int, { description: 'Product price' })
  @IsInt()
  price!: number;

  @Field(() => Int, { description: 'Product category ID' })
  @IsInt()
  productCategoryId!: number;

  @Field(() => [Badge], {
    nullable: true,
    description: 'Product badges',
    defaultValue: [],
  })
  @IsOptional()
  @IsArray()
  badges?: Badge[];

  @Field(() => [String], {
    nullable: true,
    description: 'Product interest tags',
    defaultValue: [],
  })
  @IsOptional()
  @IsArray()
  interests?: string[];

  @Field(() => ProductCondition, { description: 'Product condition' })
  @IsEnum(ProductCondition)
  condition!: ProductCondition;

  @Field(() => String, { nullable: true, description: 'Condition description' })
  @IsOptional()
  @IsString()
  conditionDescription?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether product is exchangeable',
    defaultValue: false,
  })
  @IsOptional()
  @IsBoolean()
  isExchangeable?: boolean;
}

/**
 * GraphQL Input for updating an existing product
 */
@InputType('UpdateProductInput')
export class UpdateProductInput {
  @Field(() => Int, { description: 'Product ID to update' })
  id!: number;

  @Field(() => String, { nullable: true, description: 'Product name' })
  name?: string;

  @Field(() => String, { nullable: true, description: 'Product description' })
  description?: string;

  @Field(() => String, { nullable: true, description: 'Product color' })
  color?: string;

  @Field(() => [String], { nullable: true, description: 'Product image URLs' })
  images?: string[];

  @Field(() => String, { nullable: true, description: 'Product brand' })
  brand?: string;

  @Field(() => Int, { nullable: true, description: 'Product price' })
  price?: number;

  @Field(() => Int, { nullable: true, description: 'Product category ID' })
  productCategoryId?: number;

  @Field(() => [Badge], { nullable: true, description: 'Product badges' })
  badges?: Badge[];

  @Field(() => [String], {
    nullable: true,
    description: 'Product interest tags',
  })
  interests?: string[];

  @Field(() => ProductCondition, {
    nullable: true,
    description: 'Product condition',
  })
  condition?: ProductCondition;

  @Field(() => String, { nullable: true, description: 'Condition description' })
  conditionDescription?: string;

  @Field(() => Boolean, {
    nullable: true,
    description: 'Whether product is exchangeable',
  })
  isExchangeable?: boolean;
}
