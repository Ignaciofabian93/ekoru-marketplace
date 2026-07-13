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
 * Args for listing departments with page-based pagination.
 */
@ArgsType()
export class GetDepartmentsArgs {
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
 * Args for fetching a single department by ID (admin panel).
 */
@ArgsType()
export class GetDepartmentByIdArgs {
  @Field(() => Int)
  @IsInt()
  id: number;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a single department by slug (web browsing).
 */
@ArgsType()
export class GetDepartmentBySlugArgs {
  @Field(() => String)
  @IsString()
  slug: string;

  @Field(() => Language, { defaultValue: Language.ES })
  @IsEnum(Language)
  language: Language;
}

/**
 * Args for fetching a department together with its paginated products by ID (admin panel).
 */
@ArgsType()
export class GetDepartmentProductsByIdArgs extends GetDepartmentByIdArgs {
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

/**
 * Args for fetching a department together with its paginated products by slug (web browsing).
 */
@ArgsType()
export class GetDepartmentProductsBySlugArgs extends GetDepartmentBySlugArgs {
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
