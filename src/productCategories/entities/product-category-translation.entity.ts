import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Language } from '../../graphql/enums';

/**
 * GraphQL ProductCategoryTranslation Entity
 */
@ObjectType('ProductCategoryTranslation')
export class ProductCategoryTranslationEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  productCategoryId: number;

  @Field(() => Language)
  language: Language;

  @Field(() => String)
  name: string;

  @Field(() => String)
  slug: string;

  @Field(() => [String])
  keywords: string[];

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
