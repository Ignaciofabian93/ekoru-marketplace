import { ObjectType, Field } from '@nestjs/graphql';
import { DepartmentCategoryEntity } from './department-category.entity';
import { ProductConnectionEntity } from '../../products/entities/product-connection.entity';

/**
 * GraphQL DepartmentCategoryProducts Entity
 *
 * Combined payload for department category browsing: the category itself (with
 * its translation and nested product categories resolved by field resolvers)
 * plus the paginated list of every product that lives under it.
 *
 * Clients select the full payload on the first load and only the `products`
 * field when paginating, so the category data is not re-resolved on page changes.
 *
 * Returned by getDepartmentCategoryProductsBySlug.
 */
@ObjectType('DepartmentCategoryProducts')
export class DepartmentCategoryProductsEntity {
  @Field(() => DepartmentCategoryEntity, {
    description:
      'Department category data including translation and product categories',
  })
  departmentCategory: DepartmentCategoryEntity;

  @Field(() => ProductConnectionEntity, {
    description: 'Paginated products belonging to the department category',
  })
  products: ProductConnectionEntity;
}
