import { Test, TestingModule } from '@nestjs/testing';
import { ImpactKind, ImpactRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ImpactService } from '../services/impact.service';
import { ImpactRecordsService } from './impact-records.service';

describe('ImpactRecordsService', () => {
  let service: ImpactRecordsService;
  let productFindMany: jest.Mock;
  let createMany: jest.Mock;
  let calculateCategoryImpact: jest.Mock;
  let co2FindFirst: jest.Mock;
  let waterFindFirst: jest.Mock;

  /** Two products in two categories with different impact figures. */
  const PRODUCTS = [
    { id: 1, name: 'Bicicleta urbana', productCategoryId: 10 },
    { id: 2, name: 'Cámara analógica', productCategoryId: 20 },
  ];

  const IMPACT_BY_CATEGORY: Record<
    number,
    { totalCo2SavingsKG: number; totalWaterSavingsLT: number }
  > = {
    10: { totalCo2SavingsKG: 12, totalWaterSavingsLT: 800 },
    20: { totalCo2SavingsKG: 5, totalWaterSavingsLT: 300 },
  };

  /** The rows handed to createMany, for readable assertions. */
  const writtenRows = () => createMany.mock.calls[0][0].data as any[];

  beforeEach(async () => {
    productFindMany = jest.fn().mockResolvedValue(PRODUCTS);
    createMany = jest.fn().mockResolvedValue({ count: 2 });
    co2FindFirst = jest.fn().mockResolvedValue(null);
    waterFindFirst = jest.fn().mockResolvedValue(null);
    calculateCategoryImpact = jest
      .fn()
      .mockImplementation((categoryId: number) =>
        Promise.resolve(IMPACT_BY_CATEGORY[categoryId] ?? null),
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpactRecordsService,
        {
          provide: PrismaService,
          useValue: {
            product: { findMany: productFindMany },
            sellerImpactRecord: {
              createMany,
              groupBy: jest.fn().mockResolvedValue([]),
              aggregate: jest.fn().mockResolvedValue({
                _sum: { co2SavingsKG: 12, waterSavingsLT: 800 },
                _count: { _all: 2 },
              }),
              findMany: jest.fn().mockResolvedValue([]),
            },
            co2ImpactMessage: { findFirst: co2FindFirst },
            waterImpactMessage: { findFirst: waterFindFirst },
          },
        },
        { provide: ImpactService, useValue: { calculateCategoryImpact } },
      ],
    }).compile();

    service = module.get(ImpactRecordsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('sale', () => {
    const saleInput = {
      dealId: 57,
      kind: ImpactKind.SALE,
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      productId: 1,
    };

    it('credits both participants for the same item', async () => {
      await service.recordDealImpact(saleInput);

      const rows = writtenRows();
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.sellerId).sort()).toEqual([
        'buyer-1',
        'seller-1',
      ]);
      // Both see the same saving — it's the same object being reused.
      expect(rows.every((r) => r.co2SavingsKG === 12)).toBe(true);
      expect(rows.every((r) => r.waterSavingsLT === 800)).toBe(true);
    });

    it('counts only one of the two rows platform-wide', async () => {
      await service.recordDealImpact(saleInput);

      const rows = writtenRows();
      const counted = rows.filter((r) => r.countsTowardPlatformTotal);
      // Summing both would double the platform figure for a single item.
      expect(counted).toHaveLength(1);
      expect(counted[0].role).toBe(ImpactRole.BUYER);
    });

    it('snapshots the product name and category', async () => {
      await service.recordDealImpact(saleInput);

      expect(writtenRows()[0]).toEqual(
        expect.objectContaining({
          productId: 1,
          productCategoryId: 10,
          productNameSnapshot: 'Bicicleta urbana',
          dealId: 57,
        }),
      );
    });

    it('stamps the year from the completion time', async () => {
      await service.recordDealImpact({
        ...saleInput,
        occurredAt: new Date('2026-03-04T10:00:00Z'),
      });

      expect(writtenRows().every((r) => r.year === 2026)).toBe(true);
    });

    it('writes nothing when the sale has no product', async () => {
      await expect(
        service.recordDealImpact({ ...saleInput, productId: null }),
      ).resolves.toBe(0);
      expect(createMany).not.toHaveBeenCalled();
    });
  });

  describe('exchange', () => {
    const exchangeInput = {
      dealId: 58,
      kind: ImpactKind.EXCHANGE,
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      // The buyer proposed the trade: they want product 1 and offer product 2.
      requestedProductId: 1,
      offeredProductId: 2,
    };

    it('credits each party for the item they received', async () => {
      await service.recordDealImpact(exchangeInput);

      const rows = writtenRows();
      const buyer = rows.find((r) => r.sellerId === 'buyer-1');
      const seller = rows.find((r) => r.sellerId === 'seller-1');

      // Buyer receives the requested item (product 1, category 10).
      expect(buyer).toEqual(
        expect.objectContaining({ productId: 1, co2SavingsKG: 12 }),
      );
      // Seller receives the offered item (product 2, category 20).
      expect(seller).toEqual(
        expect.objectContaining({ productId: 2, co2SavingsKG: 5 }),
      );
    });

    it('counts both rows platform-wide — two distinct items moved', async () => {
      await service.recordDealImpact(exchangeInput);

      expect(writtenRows().every((r) => r.countsTowardPlatformTotal)).toBe(
        true,
      );
    });

    it('computes impact once per category, not once per credit', async () => {
      await service.recordDealImpact(exchangeInput);

      expect(calculateCategoryImpact).toHaveBeenCalledTimes(2);
      expect(calculateCategoryImpact).toHaveBeenCalledWith(10);
      expect(calculateCategoryImpact).toHaveBeenCalledWith(20);
    });
  });

  describe('resilience', () => {
    it('records zero impact rather than failing when a category has none', async () => {
      calculateCategoryImpact.mockResolvedValue(null);

      await service.recordDealImpact({
        dealId: 59,
        kind: ImpactKind.SALE,
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        productId: 1,
      });

      const rows = writtenRows();
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.co2SavingsKG === 0)).toBe(true);
    });

    it('skips a credit whose product has vanished', async () => {
      productFindMany.mockResolvedValue([PRODUCTS[0]]);

      await service.recordDealImpact({
        dealId: 60,
        kind: ImpactKind.EXCHANGE,
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        requestedProductId: 1,
        offeredProductId: 999,
      });

      const rows = writtenRows();
      expect(rows).toHaveLength(1);
      expect(rows[0].productId).toBe(1);
    });

    it('skips duplicates so a retry tops up instead of doubling', async () => {
      await service.recordDealImpact({
        dealId: 61,
        kind: ImpactKind.SALE,
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        productId: 1,
      });

      expect(createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
    });

    it('reads products even when soft-deleted, so a retry still finds them', async () => {
      await service.recordDealImpact({
        dealId: 62,
        kind: ImpactKind.SALE,
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        productId: 1,
      });

      const where = productFindMany.mock.calls[0][0].where as Record<
        string,
        unknown
      >;
      expect(where).not.toHaveProperty('deletedAt');
    });
  });
  describe('yearly report', () => {
    it('attaches the admin-curated equivalence lines for the totals', async () => {
      co2FindFirst.mockResolvedValue({
        message1: 'Como no conducir 50 km',
        message2: 'Como plantar 2 árboles',
        message3: 'Como apagar la luz 3 días',
        translations: [],
      });

      const result = await service.impactForYear('seller-1', 2026);

      expect(result.co2Messages).toEqual([
        'Como no conducir 50 km',
        'Como plantar 2 árboles',
        'Como apagar la luz 3 días',
      ]);
      // The bucket is chosen by the total falling inside its min/max range.
      expect(co2FindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { min: { lte: 12 }, max: { gte: 12 } },
        }),
      );
    });

    it('prefers a translation over the base copy', async () => {
      co2FindFirst.mockResolvedValue({
        message1: 'base one',
        message2: 'base two',
        message3: 'base three',
        translations: [
          { message1: 'Like not driving 50 km', message2: 'b', message3: 'c' },
        ],
      });

      const result = await service.impactForYear('seller-1', 2026, 5, 'EN');

      expect(result.co2Messages[0]).toBe('Like not driving 50 km');
    });

    it('returns no lines when no bucket covers the total', async () => {
      const result = await service.impactForYear('seller-1', 2026);
      expect(result.co2Messages).toEqual([]);
      expect(result.waterMessages).toEqual([]);
    });

    it('still reports the year when the lookup fails', async () => {
      co2FindFirst.mockRejectedValue(new Error('db down'));

      const result = await service.impactForYear('seller-1', 2026);

      // Equivalence copy is decoration; the totals are the point.
      expect(result.totalCo2SavingsKG).toBe(12);
      expect(result.co2Messages).toEqual([]);
    });
  });
});
