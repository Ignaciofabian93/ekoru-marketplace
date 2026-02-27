import { ObjectType, Field, Directive } from '@nestjs/graphql';
import { ProductEntity } from './product.entity';
import { PageInfoEntity } from './page-info.entity';

/**
 * GraphQL Product Connection Entity
 *
 * Represents a paginated list of products following the connection pattern.
 * Used for all queries that return multiple products with pagination.
 */
@ObjectType('ProductConnection')
@Directive('@shareable')
export class ProductConnectionEntity {
  @Field(() => [ProductEntity], {
    description: 'List of products',
    nullable: true,
  })
  nodes: ProductEntity[];

  @Field(() => PageInfoEntity, { description: 'Pagination information' })
  pageInfo: PageInfoEntity;
}
