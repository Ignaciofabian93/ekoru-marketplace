import { ArgsType, Field, Int } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '../../graphql/enums';
import {
  ProductFilterInput,
  ProductSortInput,
} from '../../products/dto/product.input';

/**
 * Args for listing product categories with page-based pagination.
 */
@ArgsType()
export class GetProductCategoriesArgs {
  @Field(() => Int, { defaultValue: 1, description: 'Page number (1-based)' })
  @IsInt()
  page: number;

  @Field(() => Int, { defaultValue: 20, description: 'Items per page' })
  @IsInt()
  pageSize: number;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a single product category by ID (admin panel).
 */
@ArgsType()
export class GetProductCategoryByIdArgs {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a single product category by slug (web browsing).
 */
@ArgsType()
export class GetProductCategoryBySlugArgs {
  @Field(() => String)
  @IsString()
  slug: string;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching the paginated products of a product category by slug.
 */
@ArgsType()
export class GetProductCategoryProductsBySlugArgs extends GetProductCategoryBySlugArgs {
  @Field(() => Int, { defaultValue: 1, description: 'Page number (1-based)' })
  @IsInt()
  page: number;

  @Field(() => Int, { defaultValue: 20, description: 'Items per page' })
  @IsInt()
  pageSize: number;

  @Field(() => ProductFilterInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductFilterInput)
  filter?: ProductFilterInput;

  @Field(() => ProductSortInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSortInput)
  sort?: ProductSortInput;
}
