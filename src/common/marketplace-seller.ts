import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenError } from './exceptions';

/**
 * The marketplace is for second-hand items between people. Businesses sell
 * new items in their store and offer services, so a listing may only belong to
 * a PERSON seller (decided 2026-10-31). The web publish form already keeps
 * businesses out; this keeps the API from accepting what the form hides. The
 * Seller table is ekoru-users', hence raw SQL.
 */
export async function assertMarketplaceSeller(
  prisma: PrismaService,
  sellerId: string,
): Promise<void> {
  const rows = await prisma.$queryRaw<{ sellerType: string }[]>`
    SELECT "sellerType"::text AS "sellerType"
    FROM "Seller"
    WHERE "id" = ${sellerId}
    LIMIT 1`;
  if (rows[0]?.sellerType !== 'PERSON') {
    throw new ForbiddenError(
      'Only personal accounts publish in the marketplace; businesses sell from their store or as services',
    );
  }
}
