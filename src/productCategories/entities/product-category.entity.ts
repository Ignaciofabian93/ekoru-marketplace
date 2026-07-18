import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { ProductSize, WeightUnit } from '@prisma/client';
import { ProductCategoryTranslationEntity } from './product-category-translation.entity';
import { DepartmentCategoryEntity } from '../../departmentCategories';

/**
 * GraphQL ProductCategory Entity
 */
@ObjectType('ProductCategory')
export class ProductCategoryEntity {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  departmentCategoryId!: number;

  @Field(() => Float, { nullable: true })
  averageWeight?: number;

  @Field(() => ProductSize, { nullable: true })
  size?: ProductSize;

  @Field(() => WeightUnit, { nullable: true })
  weightUnit?: WeightUnit;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field(() => Int)
  sortOrder!: number;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt?: Date;

  @Field(() => ProductCategoryTranslationEntity, { nullable: true })
  translation?: ProductCategoryTranslationEntity;

  @Field(() => DepartmentCategoryEntity, {
    nullable: true,
    description: 'Department category details',
  })
  departmentCategory?: DepartmentCategoryEntity;
}
