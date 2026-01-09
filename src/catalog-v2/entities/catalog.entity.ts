import { Directive, ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('ProductCategoryItem')
export class ProductCategoryItemEntity {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  href: string;
}

@ObjectType('DepartmentCategoryItem')
export class DepartmentCategoryItemEntity {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  name: string;

  @Field(() => String)
  href: string;

  @Field(() => [ProductCategoryItemEntity])
  productCategories: ProductCategoryItemEntity[];
}

@ObjectType('MarketplaceCatalogItem')
@Directive('@key(fields: "id")')
export class MarketplaceCatalogItemEntity {
  @Field(() => Int, { description: 'Unique identifier for the department' })
  id: number;

  @Field(() => String, { description: 'Name of the department' })
  name: string;

  @Field(() => String, { description: 'Href of the department' })
  href: string;

  @Field(() => [DepartmentCategoryItemEntity], {
    description: 'Categories within this department',
  })
  categories: DepartmentCategoryItemEntity[];
}
