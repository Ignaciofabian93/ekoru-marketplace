import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminProductService } from './admin-product.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminProductService', () => {
  let service: AdminProductService;

  const productAdmin = {
    adminType: 'PLATFORM',
    role: 'MODERATOR',
    permissions: ['MANAGE_PRODUCTS'],
    isActive: true,
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    product: {
      delete: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminProductService>(AdminProductService);
    mockPrismaService.$queryRaw.mockResolvedValue([productAdmin]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteProduct', () => {
    it('should hard delete a product and return its id', async () => {
      mockPrismaService.product.delete.mockResolvedValue({ id: 7 });

      const result = await service.deleteProduct({
        adminId: 'admin-1',
        id: 7,
      });

      expect(result).toBe(7);
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: 7 },
      });
    });

    it('should reject a caller without an admin token as UNAUTHORIZED', async () => {
      await expect(service.deleteProduct({ id: 7 })).rejects.toMatchObject({
        extensions: { code: 'UNAUTHORIZED' },
      });
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
    });

    it('should reject a BUSINESS admin as FORBIDDEN', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { ...productAdmin, adminType: 'BUSINESS' },
      ]);

      await expect(
        service.deleteProduct({ adminId: 'admin-1', id: 7 }),
      ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
    });

    it('should reject a platform admin without MANAGE_PRODUCTS', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { ...productAdmin, permissions: ['MANAGE_CATEGORIES'] },
      ]);

      await expect(
        service.deleteProduct({ adminId: 'admin-1', id: 7 }),
      ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
    });

    it('should translate a P2003 constraint failure into a BadRequest', async () => {
      // Order items, exchanges or chats still reference the product.
      mockPrismaService.product.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '5.0.0',
        }),
      );

      await expect(
        service.deleteProduct({ adminId: 'admin-1', id: 7 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkUpsertProducts', () => {
    const row = {
      name: 'Guitarra usada',
      description: 'Bien cuidada',
      brand: 'Marca',
      price: 1000,
      productCategoryId: 1,
      sellerId: 'business-1',
    };

    it('refuses a listing for a business account, row by row', async () => {
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([productAdmin])
        .mockResolvedValueOnce([{ sellerType: 'COMPANY' }]);

      const result = await service.bulkUpsertProducts({
        adminId: 'admin-1',
        rows: [row],
      });

      expect(result.failed).toBe(1);
      expect(result.errors[0].message).toMatch(/personal accounts/);
      expect(mockPrismaService.product.create).not.toHaveBeenCalled();
    });

    it("creates a person's listing", async () => {
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([productAdmin])
        .mockResolvedValueOnce([{ sellerType: 'PERSON' }]);
      mockPrismaService.product.create.mockResolvedValue({ id: 9 });

      const result = await service.bulkUpsertProducts({
        adminId: 'admin-1',
        rows: [{ ...row, sellerId: 'person-1' }],
      });

      expect(result.created).toBe(1);
      expect(result.createdIds).toEqual([9]);
    });
  });
});
