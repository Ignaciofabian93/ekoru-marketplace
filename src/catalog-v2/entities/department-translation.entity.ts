import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Language } from '../../graphql/enums';

// Register the Language enum for GraphQL
registerEnumType(Language, {
  name: 'Language',
  description: 'Supported languages',
});

/**
 * GraphQL DepartmentTranslation Entity
 *
 * This is the code-first GraphQL type definition for DepartmentTranslation.
 */
@ObjectType('DepartmentTranslation')
export class DepartmentTranslationEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  departmentId: number;

  @Field(() => Language)
  language: Language;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => String, { nullable: true })
  href?: string;

  @Field(() => String, { nullable: true })
  metaTitle?: string;

  @Field(() => String, { nullable: true })
  metaDescription?: string;

  @Field(() => [String])
  metaKeywords: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
