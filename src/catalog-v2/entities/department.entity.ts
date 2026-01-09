import { ObjectType, Field, Int, Directive } from '@nestjs/graphql';
import { DepartmentCategoryEntity } from './department-category.entity';
import { DepartmentTranslationEntity } from './department-translation.entity';

/**
 * GraphQL Department Entity
 *
 * This is the code-first GraphQL type definition for Department.
 * It corresponds to the Department model in Prisma schema.
 */
@ObjectType('Department')
@Directive('@key(fields: "id")')
export class DepartmentEntity {
  @Field(() => Int, { description: 'Unique identifier' })
  id: number;

  @Field(() => Boolean, { description: 'Whether the department is active' })
  isActive: boolean;

  @Field(() => Int, { description: 'Sort order for display' })
  sortOrder: number;

  @Field(() => DepartmentTranslationEntity, {
    nullable: true,
    description: 'Translation for current language',
  })
  translation?: DepartmentTranslationEntity;

  @Field(() => [DepartmentCategoryEntity], {
    description: 'Categories within this department',
  })
  departmentCategory: DepartmentCategoryEntity[];
}
