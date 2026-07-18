import { ObjectType, Field, Int } from '@nestjs/graphql';
import { DepartmentCategoryTranslationEntity } from './department-category-translation.entity';
import { ProductCategoryEntity } from '../../productCategories/entities';
import { DepartmentEntity } from '../../departments';

/**
 * GraphQL DepartmentCategory Entity
 */
@ObjectType('DepartmentCategory')
export class DepartmentCategoryEntity {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  departmentId!: number;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field(() => Int)
  sortOrder!: number;

  @Field(() => DepartmentCategoryTranslationEntity, { nullable: true })
  translation?: DepartmentCategoryTranslationEntity;

  @Field(() => [ProductCategoryEntity], { nullable: true })
  productCategory?: ProductCategoryEntity[];

  @Field(() => DepartmentEntity, {
    nullable: true,
    description: 'Department details',
  })
  department?: DepartmentEntity;
}
