import { InputType, Field, Int } from '@nestjs/graphql';
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
export class AddProductInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  color?: string;

  @Field()
  @IsString()
  brand: string;

  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  description: string;

  @Field(() => Int)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => [String])
  @IsArray()
  images: string[];

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

  @Field(() => Int)
  @IsNumber()
  productCategoryId: number;

  @Field()
  @IsString()
  sellerId: string;

  @Field(() => ProductCondition, { nullable: true })
  @IsOptional()
  condition?: ProductCondition;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  conditionDescription?: string;
}
