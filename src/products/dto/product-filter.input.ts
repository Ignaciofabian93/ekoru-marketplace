import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Badge, ProductCondition } from '../../graphql/enums';

@InputType()
export class ProductFilterInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isExchangeable?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  productCategoryId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  departmentCategoryId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @Field(() => ProductCondition, { nullable: true })
  @IsOptional()
  condition?: ProductCondition;

  @Field(() => [Badge], { nullable: true })
  @IsOptional()
  @IsArray()
  badges?: Badge[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  color?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  interests?: string[];
}
