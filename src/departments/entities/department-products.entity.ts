import { ObjectType, Field } from '@nestjs/graphql';
import { DepartmentEntity } from './department.entity';
import { ProductConnectionEntity } from '../../products/entities/product-connection.entity';

/**
 * GraphQL DepartmentProducts Entity
 *
 * Combined payload for department browsing: the department itself (with its
 * translation and nested subcategories resolved by field resolvers) plus the
 * paginated list of every product that lives under the department.
 *
 * Returned by getDepartmentProductsBySlug (web) and getDepartmentProductsById (admin).
 */
@ObjectType('DepartmentProducts')
export class DepartmentProductsEntity {
  @Field(() => DepartmentEntity, {
    description: 'Department data including translation and subcategories',
  })
  department: DepartmentEntity;

  @Field(() => ProductConnectionEntity, {
    description: 'Paginated products belonging to the department',
  })
  products: ProductConnectionEntity;
}
