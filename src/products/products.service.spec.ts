import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Badge, ProductCondition } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    color: 'Blue',
    images: ['image1.jpg'],
    brand: 'Test Brand',
    price: 1000,
    productCategoryId: 1,
    badges: [Badge.BEST_SELLER],
    interests: ['tech'],
    condition: ProductCondition.NEW,
    conditionDescription: 'Brand new',
    isActive: true,
    isExchangeable: false,
    sellerId: 'seller-123',
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    productCategory: {
      id: 1,
      name: 'Electronics',
      departmentCategoryId: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productCategory: {
      findMany: jest.fn(),
    },
    departmentCategory: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { productCategory: true },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getProductById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct];
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.getProducts(1, 10);

      expect(result).toEqual({
        nodes: products,
        pageInfo: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          pageSize: 10,
          startCursor: null,
          endCursor: null,
        },
      });
    });

    it('should apply filters correctly', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      const filter = {
        name: 'Test',
        minPrice: 100,
        maxPrice: 500,
        condition: ProductCondition.NEW,
      };

      await service.getProducts(1, 10, filter);

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Test', mode: 'insensitive' },
            price: { lte: 500 },
            condition: ProductCondition.NEW,
          }),
        }),
      );
    });

    it('should apply sorting correctly', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      const sort = { field: 'price', order: 'asc' as const };

      await service.getProducts(1, 10, undefined, sort);

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        }),
      );
    });
  });

  describe('getProductsBySeller', () => {
    it('should return products for a specific seller', async () => {
      const products = [mockProduct];
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.getProductsBySeller('seller-123', 1, 10);

      expect(result.nodes).toEqual(products);
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sellerId: 'seller-123',
          }),
        }),
      );
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products for a specific category', async () => {
      const products = [mockProduct];
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.getProductsByCategory(1, 1, 10);

      expect(result.nodes).toEqual(products);
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productCategoryId: 1,
          }),
        }),
      );
    });
  });

  describe('getProductsByDepartmentCategory', () => {
    it('should return products from all categories under department category', async () => {
      const productCategories = [{ id: 1 }, { id: 2 }];
      mockPrismaService.productCategory.findMany.mockResolvedValue(
        productCategories,
      );
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.getProductsByDepartmentCategory(1, 1, 10);

      expect(prismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: {
          departmentCategoryId: 1,
          isActive: true,
        },
        select: { id: true },
      });

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productCategoryId: { in: [1, 2] },
          }),
        }),
      );
    });

    it('should return empty result when no categories found', async () => {
      mockPrismaService.productCategory.findMany.mockResolvedValue([]);

      const result = await service.getProductsByDepartmentCategory(1, 1, 10);

      expect(result.nodes).toEqual([]);
      expect(result.pageInfo.totalCount).toBe(0);
    });
  });

  describe('getProductsByDepartment', () => {
    it('should return products from all categories under department', async () => {
      const departmentCategories = [{ id: 1 }, { id: 2 }];
      const productCategories = [{ id: 1 }, { id: 2 }, { id: 3 }];

      mockPrismaService.departmentCategory.findMany.mockResolvedValue(
        departmentCategories,
      );
      mockPrismaService.productCategory.findMany.mockResolvedValue(
        productCategories,
      );
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.getProductsByDepartment(1, 1, 10);

      expect(prismaService.departmentCategory.findMany).toHaveBeenCalled();
      expect(prismaService.productCategory.findMany).toHaveBeenCalled();
    });
  });

  describe('getExchangeableProducts', () => {
    it('should return only exchangeable products', async () => {
      const exchangeableProduct = { ...mockProduct, isExchangeable: true };
      mockPrismaService.product.findMany.mockResolvedValue([
        exchangeableProduct,
      ]);
      mockPrismaService.product.count.mockResolvedValue(1);

      await service.getExchangeableProducts(1, 10);

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isExchangeable: true,
          }),
        }),
      );
    });
  });

  describe('addProduct', () => {
    it('should create a new product', async () => {
      const input = {
        name: 'New Product',
        description: 'Description',
        images: ['image.jpg'],
        brand: 'Brand',
        price: 500,
        productCategoryId: 1,
        condition: ProductCondition.NEW,
        badges: [],
        interests: [],
      };

      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.addProduct(input, 'seller-123');

      expect(result).toEqual(mockProduct);
      expect(prismaService.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...input,
          sellerId: 'seller-123',
        }),
        include: { productCategory: true },
      });
    });

    it('should throw UnauthorizedException when sellerId is missing', async () => {
      const input = {
        name: 'New Product',
        description: 'Description',
        images: ['image.jpg'],
        brand: 'Brand',
        price: 500,
        productCategoryId: 1,
        condition: ProductCondition.NEW,
      };

      await expect(service.addProduct(input, undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const input = {
        id: 1,
        name: 'Updated Product',
        price: 1500,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...input,
      });

      const result = await service.updateProduct(input, 'seller-123');

      expect(result.name).toBe('Updated Product');
      expect(prismaService.product.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      const input = { id: 999, name: 'Updated' };
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.updateProduct(input, 'seller-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when seller does not own product', async () => {
      const input = { id: 1, name: 'Updated' };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.updateProduct(input, 'wrong-seller'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
        isActive: false,
      });

      const result = await service.deleteProduct(1);

      expect(result.isActive).toBe(false);
      expect(result.deletedAt).toBeTruthy();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.deleteProduct(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleProductActive', () => {
    it('should toggle product active status', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        isActive: false,
      });

      const result = await service.toggleProductActive(1, 'seller-123');

      expect(result.isActive).toBe(false);
    });

    it('should throw ForbiddenException when seller does not own product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.toggleProductActive(1, 'wrong-seller'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
