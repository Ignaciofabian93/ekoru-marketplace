import {
  Args,
  Context,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { ImpactKind, Language } from '@prisma/client';

import { ImpactRecordsService } from './impact-records.service';
import { SellerImpactYear } from './entities';
import type { GraphQLContext } from '../types/graphql-context.interface';

@Resolver(() => SellerImpactYear)
export class ImpactRecordsResolver {
  constructor(private readonly impactRecords: ImpactRecordsService) {}

  /**
   * Internal: freeze the environmental saving of a completed P2P deal.
   * Guarded by INTERNAL_SERVICE_SECRET — only the transactions subgraph calls
   * it, at the moment the deal completes.
   *
   * Returns the number of records written. Idempotent, so a retry after a
   * partial failure is safe.
   */
  @Mutation(() => Int, { name: 'recordDealImpact' })
  async recordDealImpact(
    @Args('dealId', { type: () => Int }) dealId: number,
    @Args('kind', { type: () => ImpactKind }) kind: ImpactKind,
    @Args('buyerId', { type: () => ID }) buyerId: string,
    @Args('sellerId', { type: () => ID }) sellerId: string,
    @Context() ctx: GraphQLContext,
    @Args('productId', { type: () => Int, nullable: true }) productId?: number,
    @Args('requestedProductId', { type: () => Int, nullable: true })
    requestedProductId?: number,
    @Args('offeredProductId', { type: () => Int, nullable: true })
    offeredProductId?: number,
  ): Promise<number> {
    this.assertInternal(ctx);
    return this.impactRecords.recordDealImpact({
      dealId,
      kind,
      buyerId,
      sellerId,
      productId,
      requestedProductId,
      offeredProductId,
    });
  }

  /** Years the signed-in seller has any recorded impact in, newest first. */
  @Query(() => [Int], { name: 'myImpactYears' })
  async myImpactYears(@Context() ctx: GraphQLContext): Promise<number[]> {
    const sellerId = requireSeller(ctx);
    return this.impactRecords.impactYears(sellerId);
  }

  /**
   * The signed-in seller's savings for one year — the data behind a
   * year-in-review screen. Defaults to the current year.
   */
  @Query(() => SellerImpactYear, { name: 'myImpactYear' })
  async myImpactYear(
    @Context() ctx: GraphQLContext,
    @Args('year', { type: () => Int, nullable: true }) year?: number,
    @Args('topItems', { type: () => Int, defaultValue: 5 }) topItems?: number,
    @Args('language', { type: () => Language, nullable: true })
    language?: Language,
  ): Promise<SellerImpactYear> {
    const sellerId = requireSeller(ctx);
    return this.impactRecords.impactForYear(
      sellerId,
      year ?? new Date().getUTCFullYear(),
      topItems ?? 5,
      language,
    );
  }

  /** Header-only; see the note on ProductsResolver.assertInternal. */
  private assertInternal(ctx: GraphQLContext): void {
    const expected = process.env.INTERNAL_SERVICE_SECRET;
    if (!expected) throw new Error('INTERNAL_SERVICE_SECRET no configurado');
    if (!ctx.internalSecret || ctx.internalSecret !== expected) {
      throw new Error('Unauthorized');
    }
  }
}

function requireSeller(ctx: GraphQLContext): string {
  const sellerId = ctx.sellerId;
  if (!sellerId) throw new Error('Debe iniciar sesión');
  return sellerId;
}
