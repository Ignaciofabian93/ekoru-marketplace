import { ArgsType, Field, InputType, Int, Float } from '@nestjs/graphql';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Language } from '../../graphql/enums';

/**
 * Admin impact-table inputs.
 *
 * Every `*UpsertRowInput` follows the shared catalog contract:
 * - `id` present            → update that row (only the provided fields change)
 * - no `id`, translation row → upsert by its (parentId, language) unique key
 * - no `id`, base row        → create
 *
 * Omitted fields are left untouched on update; explicit `null` clears a
 * nullable column.
 */

@ArgsType()
export class RawImpactListArgs {
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
    description: 'Filters rows by a text match (material type / first message)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

// ─── Material impact estimates ────────────────────────────────────────────────

@InputType()
export class MaterialImpactEstimateUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Unique material key. Required when creating (no id).',
  })
  @IsOptional()
  @IsString()
  materialType?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  estimatedCo2SavingsKG?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  estimatedWaterSavingsLT?: number;
}

@InputType()
export class MaterialImpactEstimateTranslationUpsertRowInput {
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
  materialImpactEstimateId?: number;

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
  materialTypeTranslation?: string;
}

// ─── Water impact messages ────────────────────────────────────────────────────

@InputType()
export class WaterImpactMessageUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  min?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  max?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message1?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message3?: string;
}

@InputType()
export class WaterImpactMessageTranslationUpsertRowInput {
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
  waterImpactMessageId?: number;

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
  message1?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message3?: string;
}

// ─── CO2 impact messages ──────────────────────────────────────────────────────

@InputType()
export class Co2ImpactMessageUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  min?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  max?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message1?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message3?: string;
}

@InputType()
export class Co2ImpactMessageTranslationUpsertRowInput {
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
  co2ImpactMessageId?: number;

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
  message1?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message2?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  message3?: string;
}
