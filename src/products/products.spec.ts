import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
  UnAuthorizedError,
} from '../common/exceptions/graphql.exceptions';
import { AddProductInput, UpdateProductInput } from './dto';
import {
  Badge,
  ProductCondition,
  ProductSortField,
  SortOrder,
} from '../graphql/enums';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockProduct = {
    id: 1,
    sku: 'TEST-001',
    barcode: '123456789',
    color: 'Blue',
    brand: 'TestBrand',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    images: ['image1.jpg', 'image2.jpg'],
    isExchangeable: false,
    interests: ['sports', 'outdoors'],
    isActive: true,
    productCategoryId: 1,
    sellerId: 'seller-123',
    condition: 'NEW',
    badges: ['eco-friendly'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
    productCategory: {
      id: 1,
      name: 'Electronics',
      materials: [],
      departmentCategory: {
        id: 1,
        name: 'Tech',
        department: {
          id: 1,
          name: 'Main',
        },
      },
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

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct];
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue(products);

      const result = await service.getProducts(1, 20);

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('pageInfo');
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toEqual(mockProduct);
      expect(mockPrismaService.product.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });

    it('should apply name filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { name: 'Test' });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Test', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should apply price range filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { minPrice: 50, maxPrice: 150 });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 50, lte: 150 },
          }),
        }),
      );
    });

    it('should apply isActive filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { isActive: true });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });

    it('should apply seller filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { sellerId: 'seller-123' });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sellerId: 'seller-123',
          }),
        }),
      );
    });

    it('should apply sorting by price', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, undefined, {
        field: ProductSortField.PRICE,
        order: SortOrder.ASC,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        }),
      );
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.count.mockRejectedValue(new Error('DB Error'));

      await expect(service.getProducts()).rejects.toThrow(InternalServerError);
    });
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundError if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getProductById(999)).rejects.toThrow(NotFoundError);
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.findUnique.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(service.getProductById(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getProductsBySeller', () => {
    it('should return products for a specific seller', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.getProductsBySeller('seller-123', 1, 20);

      expect(result.nodes).toHaveLength(1);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sellerId: 'seller-123',
          }),
        }),
      );
    });

    it('should apply filters for seller products', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProductsBySeller('seller-123', 1, 20, {
        isActive: true,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sellerId: 'seller-123',
            isActive: true,
          }),
        }),
      );
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.count.mockRejectedValue(new Error('DB Error'));

      await expect(service.getProductsBySeller('seller-123')).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products for a specific category', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.getProductsByCategory(1, 1, 20);

      expect(result.nodes).toHaveLength(1);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productCategoryId: 1,
          }),
        }),
      );
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.count.mockRejectedValue(new Error('DB Error'));

      await expect(service.getProductsByCategory(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getExchangeableProducts', () => {
    it('should return only exchangeable and active products', async () => {
      const exchangeableProduct = { ...mockProduct, isExchangeable: true };
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([
        exchangeableProduct,
      ]);

      const result = await service.getExchangeableProducts(1, 20);

      expect(result.nodes).toHaveLength(1);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isExchangeable: true,
            isActive: true,
          }),
        }),
      );
    });

    it('should apply filters for exchangeable products', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getExchangeableProducts(1, 20, {
        productCategoryId: 1,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isExchangeable: true,
            isActive: true,
            productCategoryId: 1,
          }),
        }),
      );
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.count.mockRejectedValue(new Error('DB Error'));

      await expect(service.getExchangeableProducts()).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('addProduct', () => {
    const addProductInput: AddProductInput = {
      name: 'New Product',
      description: 'New Description',
      price: 150,
      brand: 'NewBrand',
      images: ['new-image.jpg'],
      isExchangeable: false,
      productCategoryId: 1,
      sellerId: 'seller-123',
    };

    it('should create a new product', async () => {
      const newProduct = { ...mockProduct, ...addProductInput };
      mockPrismaService.product.create.mockResolvedValue(newProduct);

      const result = await service.addProduct(addProductInput, 'seller-123');

      expect(result).toEqual(newProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          ...addProductInput,
          sellerId: 'seller-123',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw UnAuthorizedError if sellerId is not provided', async () => {
      await expect(service.addProduct(addProductInput)).rejects.toThrow(
        UnAuthorizedError,
      );
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.addProduct(addProductInput, 'seller-123'),
      ).rejects.toThrow(InternalServerError);
    });
  });

  describe('updateProduct', () => {
    const updateProductInput: UpdateProductInput = {
      id: '1',
      name: 'Updated Product',
      price: 200,
    };

    it('should update an existing product', async () => {
      const updatedProduct = { ...mockProduct, ...updateProductInput };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(
        updateProductInput,
        'seller-123',
      );

      expect(result).toEqual(updatedProduct);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { sellerId: true },
      });
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Product',
          price: 200,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw UnAuthorizedError if sellerId is not provided', async () => {
      await expect(service.updateProduct(updateProductInput)).rejects.toThrow(
        UnAuthorizedError,
      );
    });

    it('should throw NotFoundError if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProduct(updateProductInput, 'seller-123'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw UnAuthorizedError if seller does not own the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...mockProduct,
        sellerId: 'other-seller',
      });

      await expect(
        service.updateProduct(updateProductInput, 'seller-123'),
      ).rejects.toThrow(UnAuthorizedError);
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.findUnique.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        service.updateProduct(updateProductInput, 'seller-123'),
      ).rejects.toThrow(InternalServerError);
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product', async () => {
      const deletedProduct = { ...mockProduct, deletedAt: new Date() };
      mockPrismaService.product.update.mockResolvedValue(deletedProduct);

      const result = await service.deleteProduct(1);

      expect(result).toEqual(deletedProduct);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.update.mockRejectedValue(new Error('DB Error'));

      await expect(service.deleteProduct(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('toggleProductActive', () => {
    it('should toggle product active status to false', async () => {
      const toggledProduct = { ...mockProduct, isActive: false };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue(toggledProduct);

      const result = await service.toggleProductActive(1, 'seller-123');

      expect(result).toEqual(toggledProduct);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should toggle product active status to true', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false };
      const toggledProduct = { ...mockProduct, isActive: true };
      mockPrismaService.product.findUnique.mockResolvedValue(inactiveProduct);
      mockPrismaService.product.update.mockResolvedValue(toggledProduct);

      const result = await service.toggleProductActive(1, 'seller-123');

      expect(result).toEqual(toggledProduct);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          isActive: true,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw UnAuthorizedError if sellerId is not provided', async () => {
      await expect(service.toggleProductActive(1)).rejects.toThrow(
        UnAuthorizedError,
      );
    });

    it('should throw NotFoundError if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleProductActive(1, 'seller-123'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw UnAuthorizedError if seller does not own the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...mockProduct,
        sellerId: 'other-seller',
      });

      await expect(
        service.toggleProductActive(1, 'seller-123'),
      ).rejects.toThrow(UnAuthorizedError);
    });

    it('should handle errors and throw InternalServerError', async () => {
      mockPrismaService.product.findUnique.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        service.toggleProductActive(1, 'seller-123'),
      ).rejects.toThrow(InternalServerError);
    });
  });

  describe('buildProductWhereClause (integration)', () => {
    it('should handle department category filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { departmentCategoryId: 1 });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productCategory: { departmentCategoryId: 1 },
          }),
        }),
      );
    });

    it('should handle department filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { departmentId: 1 });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productCategory: {
              departmentCategory: { departmentId: 1 },
            },
          }),
        }),
      );
    });

    it('should handle badges filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { badges: [Badge.SUSTAINABLE] });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            badges: { hasSome: [Badge.SUSTAINABLE] },
          }),
        }),
      );
    });

    it('should handle interests filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { interests: ['sports'] });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            interests: { hasSome: ['sports'] },
          }),
        }),
      );
    });

    it('should handle condition filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { condition: ProductCondition.NEW });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            condition: ProductCondition.NEW,
          }),
        }),
      );
    });

    it('should handle brand filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { brand: 'Nike' });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brand: { contains: 'Nike', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should handle color filter', async () => {
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      await service.getProducts(1, 20, { color: 'Blue' });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            color: { contains: 'Blue', mode: 'insensitive' },
          }),
        }),
      );
    });
  });
});
