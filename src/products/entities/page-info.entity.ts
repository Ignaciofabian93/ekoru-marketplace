import { ObjectType, Field, Int, Directive } from '@nestjs/graphql';

/**
 * GraphQL PageInfo Entity
 *
 * Contains pagination metadata for connection-based pagination.
 */
@ObjectType('PageInfo')
@Directive('@shareable')
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

  @Field(() => String, { nullable: true })
  startCursor: string | null;

  @Field(() => String, { nullable: true })
  endCursor: string | null;

  @Field(() => Int)
  pageSize: number;
}
