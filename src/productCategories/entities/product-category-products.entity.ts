import { ObjectType, Field } from '@nestjs/graphql';
import { ProductCategoryEntity } from './product-category.entity';
import { ProductConnectionEntity } from '../../products/entities/product-connection.entity';

/**
 * GraphQL ProductCategoryProducts Entity
 *
 * Combined payload for product category browsing: the product category itself
 * (with its translation resolved by field resolvers) plus the paginated list
 * of its products.
 *
 * Clients select the full payload on the first load and only the `products`
 * field when paginating, so the category data is not re-resolved on page changes.
 *
 * Returned by getProductCategoryProductsBySlug.
 */
@ObjectType('ProductCategoryProducts')
export class ProductCategoryProductsEntity {
  @Field(() => ProductCategoryEntity, {
    description: 'Product category data including translation',
  })
  productCategory: ProductCategoryEntity;

  @Field(() => ProductConnectionEntity, {
    description: 'Paginated products belonging to the product category',
  })
  products: ProductConnectionEntity;
}
