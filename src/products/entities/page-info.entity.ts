import { ObjectType, Field, Int } from '@nestjs/graphql';

/**
 * GraphQL PageInfo Entity
 *
 * Contains pagination metadata for connection-based pagination.
 */
@ObjectType('PageInfo')
export class PageInfoEntity {
  @Field(() => Int, { description: 'Current page number' })
  currentPage: number;

  @Field(() => Int, { description: 'Total number of pages' })
  totalPages: number;

  @Field(() => Int, { description: 'Total count of items' })
  totalCount: number;

  @Field(() => Boolean, { description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @Field(() => Boolean, { description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}
