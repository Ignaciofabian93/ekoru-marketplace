import { InputType, Field, ID, Int, Float } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { Badge, ProductCondition } from '../../graphql/enums';

@InputType()
export class UpdateProductInput {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sku?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  color?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  images?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasOffer?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  offerPrice?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isExchangeable?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  interests?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => [Badge], { nullable: true })
  @IsOptional()
  @IsArray()
  badges?: Badge[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  productCategoryId?: number;

  @Field(() => ProductCondition, { nullable: true })
  @IsOptional()
  condition?: ProductCondition;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  conditionDescription?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  sustainabilityScore?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  materialComposition?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  recycledContent?: number;
}
