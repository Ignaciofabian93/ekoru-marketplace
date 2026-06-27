import { Test, TestingModule } from '@nestjs/testing';
import { ProductsResolver, SellerReferenceResolver } from './products.resolver';
import { ProductsService } from './products.service';
import { ImpactService } from '../services/impact.service';
import { ProductEntity } from './entities/product.entity';
import { Badge, ProductCondition } from '@prisma/client';

describe('ProductsResolver', () => {
  let resolver: ProductsResolver;
  let productsService: ProductsService;
  let impactService: ImpactService;

  const mockProduct: Partial<ProductEntity> = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    price: 1000,
    productCategoryId: 1,
    sellerId: 'seller-123',
    condition: ProductCondition.NEW,
    badges: [Badge.BEST_SELLER],
    interests: ['tech'],
    isActive: true,
    isExchangeable: false,
    viewCount: 0,
    images: ['image.jpg'],
    brand: 'Test Brand',
  };

  const mockPaginatedResult = {
    edges: [mockProduct],
    pageInfo: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  const mockProductsService = {
    getProductById: jest.fn(),
    getProducts: jest.fn(),
    getProductsBySeller: jest.fn(),
    getProductsByCategory: jest.fn(),
    getProductsByDepartmentCategory: jest.fn(),
    getProductsByDepartment: jest.fn(),
    getExchangeableProducts: jest.fn(),
    addProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    toggleProductActive: jest.fn(),
  };

  const mockImpactService = {
    calculateCategoryImpact: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsResolver,
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: ImpactService,
          useValue: mockImpactService,
        },
      ],
    }).compile();

    resolver = module.get<ProductsResolver>(ProductsResolver);
    productsService = module.get<ProductsService>(ProductsService);
    impactService = module.get<ImpactService>(ImpactService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      mockProductsService.getProductById.mockResolvedValue(mockProduct);

      const result = await resolver.getProductById('1');

      expect(result).toEqual(mockProduct);
      expect(productsService.getProductById).toHaveBeenCalledWith(1);
    });
  });

  describe('getProducts', () => {
    it('should return paginated products with default values', async () => {
      mockProductsService.getProducts.mockResolvedValue(mockPaginatedResult);

      const result = await resolver.getProducts(1, 10);

      expect(result).toEqual(mockPaginatedResult);
      expect(productsService.getProducts).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        filter: undefined,
        sort: undefined,
        excludeSellerId: undefined,
      });
    });

    it('should return products with filter and sort', async () => {
      const filter = { name: 'Test', minPrice: 100 };
      const sort = { field: 'price', order: 'asc' as const };
      mockProductsService.getProducts.mockResolvedValue(mockPaginatedResult);

      await resolver.getProducts(1, 10, undefined, filter, sort);

      expect(productsService.getProducts).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        filter,
        sort,
        excludeSellerId: undefined,
      });
    });

    it("should exclude the current seller's own products when logged in", async () => {
      mockProductsService.getProducts.mockResolvedValue(mockPaginatedResult);

      await resolver.getProducts(1, 10, 'seller-123');

      expect(productsService.getProducts).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        filter: undefined,
        sort: undefined,
        excludeSellerId: 'seller-123',
      });
    });
  });

  describe('getProductsBySeller', () => {
    it('should return products for a specific seller', async () => {
      mockProductsService.getProductsBySeller.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await resolver.getProductsBySeller('seller-123', 1, 10);

      expect(result).toEqual(mockPaginatedResult);
      expect(productsService.getProductsBySeller).toHaveBeenCalledWith({
        sellerId: 'seller-123',
        page: 1,
        pageSize: 10,
        filter: undefined,
        sort: undefined,
      });
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products for a specific category', async () => {
      mockProductsService.getProductsByCategory.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await resolver.getProductsByCategory('1', 1, 10);

      expect(result).toEqual(mockPaginatedResult);
      expect(productsService.getProductsByCategory).toHaveBeenCalledWith({
        productCategoryId: 1,
        page: 1,
        pageSize: 10,
        filter: undefined,
        sort: undefined,
        excludeSellerId: undefined,
      });
    });
  });

  describe('getProductsByDepartmentCategory', () => {
    it('should return products from department category', async () => {
      mockProductsService.getProductsByDepartmentCategory.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await resolver.getProductsByDepartmentCategory('1', 1, 10);

      expect(result).toEqual(mockPaginatedResult);
      expect(
        productsService.getProductsByDepartmentCategory,
      ).toHaveBeenCalledWith({
        departmentCategoryId: 1,
        page: 1,
        pageSize: 10,
        filter: undefined,
        sort: undefined,
        excludeSellerId: undefined,
      });
    });
  });

  describe('getProductsByDepartment', () => {
    it('should return products from department', async () => {
      mockProductsService.getProductsByDepartment.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await resolver.getProductsByDepartment('1', 1, 10);

      expect(result).toEqual(mockPaginatedResult);
      expect(productsService.getProductsByDepartment).toHaveBeenCalledWith({
        departmentId: 1,
        page: 1,
        pageSize: 10,
        filter: undefined,
        sort: undefined,
        excludeSellerId: undefined,
      });
    });
  });

  describe('getExchangeableProducts', () => {
    it('should return exchangeable products', async () => {
      mockProductsService.getExchangeableProducts.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await resolver.getExchangeableProducts(1, 10);

      expect(result).toEqual(mockPaginatedResult);
      expect(productsService.getExchangeableProducts).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        filter: undefined,
        sort: undefined,
        excludeSellerId: undefined,
      });
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
      };

      mockProductsService.addProduct.mockResolvedValue(mockProduct);

      const result = await resolver.addProduct(input, 'seller-123');

      expect(result).toEqual(mockProduct);
      expect(productsService.addProduct).toHaveBeenCalledWith({
        input,
        sellerId: 'seller-123',
      });
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const input = {
        id: 1,
        name: 'Updated Product',
      };

      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      mockProductsService.updateProduct.mockResolvedValue(updatedProduct);

      const result = await resolver.updateProduct(input, 'seller-123');

      expect(result).toEqual(updatedProduct);
      expect(productsService.updateProduct).toHaveBeenCalledWith({
        input,
        sellerId: 'seller-123',
        adminId: undefined,
      });
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      mockProductsService.deleteProduct.mockResolvedValue(mockProduct);

      const result = await resolver.deleteProduct('1');

      expect(result).toEqual(mockProduct);
      expect(productsService.deleteProduct).toHaveBeenCalledWith({
        id: 1,
        sellerId: undefined,
        adminId: undefined,
      });
    });
  });

  describe('toggleProductActive', () => {
    it('should toggle product active status', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false };
      mockProductsService.toggleProductActive.mockResolvedValue(
        inactiveProduct,
      );

      const result = await resolver.toggleProductActive('1', 'seller-123');

      expect(result).toEqual(inactiveProduct);
      expect(productsService.toggleProductActive).toHaveBeenCalledWith({
        id: 1,
        sellerId: 'seller-123',
        adminId: undefined,
      });
    });
  });

  describe('Field Resolvers', () => {
    describe('productCategory', () => {
      it('should return product category if present', () => {
        const productWithCategory = {
          ...mockProduct,
          productCategory: { id: 1, name: 'Electronics' },
        } as any;

        const result = resolver.productCategory(productWithCategory);

        expect(result).toEqual({ id: 1, name: 'Electronics' });
      });

      it('should return null if product category not present', () => {
        const result = resolver.productCategory(mockProduct as any);

        expect(result).toBeNull();
      });
    });

    describe('seller', () => {
      it('should return seller if present', () => {
        const productWithSeller = {
          ...mockProduct,
          seller: { id: 'seller-123' },
        } as any;

        const result = resolver.seller(productWithSeller);

        expect(result).toEqual({ id: 'seller-123' });
      });

      it('should return federation reference if seller not present', () => {
        const result = resolver.seller(mockProduct as any);

        expect(result).toEqual({
          __typename: 'Seller',
          id: 'seller-123',
        });
      });
    });

    describe('environmentalImpact', () => {
      it('should return environmental impact data', async () => {
        const impactData = {
          totalCo2SavingsKG: 10.5,
          totalWaterSavingsLT: 50.2,
          materialBreakdown: [],
        };

        mockImpactService.calculateCategoryImpact.mockResolvedValue(impactData);

        const result = await resolver.environmentalImpact(
          mockProduct as any,
          { language: 'EN' } as any,
        );

        expect(result).toEqual(impactData);
        expect(impactService.calculateCategoryImpact).toHaveBeenCalledWith(
          1,
          'EN',
        );
      });

      it('should return null on error', async () => {
        mockImpactService.calculateCategoryImpact.mockRejectedValue(
          new Error('Test error'),
        );

        const result = await resolver.environmentalImpact(
          mockProduct as any,
          { language: 'EN' } as any,
        );

        expect(result).toBeNull();
      });
    });
  });
});

describe('SellerReferenceResolver', () => {
  let resolver: SellerReferenceResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SellerReferenceResolver],
    }).compile();

    resolver = module.get<SellerReferenceResolver>(SellerReferenceResolver);
  });

  describe('resolveReference', () => {
    it('should return the reference as-is', () => {
      const reference = { __typename: 'Seller', id: 'seller-123' };

      const result = resolver.resolveReference(reference);

      expect(result).toEqual(reference);
    });
  });
});
