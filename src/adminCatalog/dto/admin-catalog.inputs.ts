import { ArgsType, Field, InputType, Int, Float } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Language, ProductSize, WeightUnit } from '../../graphql/enums';

/**
 * Admin catalog inputs.
 *
 * Every `*UpsertRowInput` follows the same contract, designed for XLSX
 * round-trips AND single-row edits from the admin panel:
 * - `id` present            → update that row (only the provided fields change)
 * - no `id`, translation row → upsert by its (parentId, language) unique key
 * - no `id`, base row        → create
 *
 * Omitted fields are left untouched on update; explicit `null` clears a
 * nullable column.
 */

// ─── Args shared by the raw list queries ─────────────────────────────────────

@ArgsType()
export class RawCatalogListArgs {
  @Field(() => Int, {
    nullable: true,
    description: 'Fetch a single row by id (edit screens)',
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
    description: 'Filters rows whose translation name contains this text',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

@ArgsType()
export class RawDepartmentCategoriesArgs extends RawCatalogListArgs {
  @Field(() => Int, {
    nullable: true,
    description: 'Filter by parent department',
  })
  @IsOptional()
  @IsInt()
  departmentId?: number;
}

@ArgsType()
export class RawProductCategoriesArgs extends RawCatalogListArgs {
  @Field(() => Int, {
    nullable: true,
    description: 'Filter by parent department category',
  })
  @IsOptional()
  @IsInt()
  departmentCategoryId?: number;
}

// ─── Departments ─────────────────────────────────────────────────────────────

@InputType()
export class DepartmentUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredUntil?: Date | null;
}

@InputType()
export class DepartmentTranslationUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Required when creating (no id)',
  })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @Field(() => Language, {
    nullable: true,
    description: 'Required when creating (no id)',
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  href?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metaTitle?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metaDescription?: string | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  metaKeywords?: string[];
}

// ─── Department categories ───────────────────────────────────────────────────

@InputType()
export class DepartmentCategoryUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Int, {
    nullable: true,
    description:
      'Parent department. Required when creating; on update it re-parents the category',
  })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredUntil?: Date | null;
}

@InputType()
export class DepartmentCategoryTranslationUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Required when creating (no id)',
  })
  @IsOptional()
  @IsInt()
  departmentCategoryId?: number;

  @Field(() => Language, {
    nullable: true,
    description: 'Required when creating (no id)',
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  href?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metaTitle?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metaDescription?: string | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  metaKeywords?: string[];
}

// ─── Product categories ──────────────────────────────────────────────────────

@InputType()
export class ProductCategoryUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Int, {
    nullable: true,
    description:
      'Parent department category. Required when creating; on update it re-parents ' +
      'the product category (the fix for wrongly related rows)',
  })
  @IsOptional()
  @IsInt()
  departmentCategoryId?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  averageWeight?: number | null;

  @Field(() => ProductSize, { nullable: true })
  @IsOptional()
  @IsEnum(ProductSize)
  size?: ProductSize | null;

  @Field(() => WeightUnit, { nullable: true })
  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  featuredUntil?: Date | null;
}

@InputType()
export class ProductCategoryTranslationUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Required when creating (no id)',
  })
  @IsOptional()
  @IsInt()
  productCategoryId?: number;

  @Field(() => Language, {
    nullable: true,
    description: 'Required when creating (no id)',
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  keywords?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  href?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metaTitle?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metaDescription?: string | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  metaKeywords?: string[];
}
