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
 * Args for listing department categories with page-based pagination.
 */
@ArgsType()
export class GetDepartmentCategoriesArgs {
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
 * Args for fetching a single department category by ID (admin panel).
 */
@ArgsType()
export class GetDepartmentCategoryByIdArgs {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a single department category by slug (web browsing).
 */
@ArgsType()
export class GetDepartmentCategoryBySlugArgs {
  @Field(() => String)
  @IsString()
  slug: string;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching the paginated products of a department category by slug.
 */
@ArgsType()
export class GetDepartmentCategoryProductsBySlugArgs extends GetDepartmentCategoryBySlugArgs {
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
