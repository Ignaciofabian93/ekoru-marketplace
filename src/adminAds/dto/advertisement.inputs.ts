import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AdvertisementType } from '../../graphql/enums';

/**
 * Admin advertisement inputs.
 *
 * The bulk upsert follows the shared catalog contract:
 * - `id` present → update that row (only the provided fields change)
 * - no `id`      → create (adType/price/content/startDate/endDate/sellerId required)
 *
 * Omitted fields are left untouched on update; explicit `null` clears a
 * nullable column (the promoted-item ids).
 */

@ArgsType()
export class RawAdvertisementListArgs {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int, { defaultValue: 50 })
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize: number;

  @Field(() => String, {
    nullable: true,
    description: 'Filters ads whose content contains this text',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => AdvertisementType, { nullable: true })
  @IsOptional()
  @IsEnum(AdvertisementType)
  adType?: AdvertisementType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class AdvertisementUpsertRowInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  id?: number;

  @Field(() => AdvertisementType, {
    nullable: true,
    description: 'Required when creating.',
  })
  @IsOptional()
  @IsEnum(AdvertisementType)
  adType?: AdvertisementType;

  @Field(() => Int, { nullable: true, description: 'Required when creating.' })
  @IsOptional()
  @IsInt()
  price?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Required when creating.',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @Field(() => Date, { nullable: true, description: 'Required when creating.' })
  @IsOptional()
  startDate?: Date;

  @Field(() => Date, { nullable: true, description: 'Required when creating.' })
  @IsOptional()
  endDate?: Date;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Owner seller. Required when creating (no id).',
  })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  productId?: number | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  storeProductId?: number | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  serviceId?: number | null;
}
