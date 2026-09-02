import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminProductService } from './admin-product.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminProductService', () => {
  let service: AdminProductService;

  const mockPrismaService = {
    product: {
      delete: jest.fn(),
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

    it('should throw UnauthorizedException without an admin', async () => {
      await expect(service.deleteProduct({ id: 7 })).rejects.toThrow(
        UnauthorizedException,
      );
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
});
