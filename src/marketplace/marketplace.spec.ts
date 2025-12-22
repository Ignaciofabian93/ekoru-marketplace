import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
  UnAuthorizedError,
} from '../common/exceptions/graphql.exceptions';

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  const mockPrismaService = {
    department: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    departmentCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    productCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDepartments', () => {
    const mockDepartments = [
      {
        id: 1,
        departmentName: 'Electronics',
        departmentImage: 'electronics.jpg',
        href: '/electronics',
      },
      {
        id: 2,
        departmentName: 'Clothing',
        departmentImage: 'clothing.jpg',
        href: '/clothing',
      },
    ];

    it('should return departments when sellerId is provided', async () => {
      mockPrismaService.department.findMany.mockResolvedValue(mockDepartments);

      const result = await service.getDepartments('seller-123');

      expect(result).toEqual(mockDepartments);
      expect(mockPrismaService.department.findMany).toHaveBeenCalledWith({
        orderBy: {
          departmentName: 'asc',
        },
      });
    });

    it('should throw UnAuthorizedError when sellerId is not provided', async () => {
      await expect(service.getDepartments()).rejects.toThrow(UnAuthorizedError);
      await expect(service.getDepartments()).rejects.toThrow('No autorizado.');
    });

    it('should throw UnAuthorizedError when sellerId is undefined', async () => {
      await expect(service.getDepartments(undefined)).rejects.toThrow(
        UnAuthorizedError,
      );
    });

    it('should throw InternalServerError when database error occurs', async () => {
      mockPrismaService.department.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getDepartments('seller-123')).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.getDepartments('seller-123')).rejects.toThrow(
        'Error al obtener los departamentos.',
      );
    });
  });

  describe('getDepartmentCategoriesByDepartmentId', () => {
    const mockDepartmentCategories = [
      {
        id: 1,
        departmentCategoryName: 'Phones',
        departmentId: 1,
        href: '/phones',
      },
      {
        id: 2,
        departmentCategoryName: 'Laptops',
        departmentId: 1,
        href: '/laptops',
      },
    ];

    it('should return department categories when sellerId is provided', async () => {
      mockPrismaService.departmentCategory.findMany.mockResolvedValue(
        mockDepartmentCategories,
      );

      const result = await service.getDepartmentCategoriesByDepartmentId(
        1,
        'seller-123',
      );

      expect(result).toEqual(mockDepartmentCategories);
      expect(
        mockPrismaService.departmentCategory.findMany,
      ).toHaveBeenCalledWith({
        where: {
          departmentId: 1,
        },
        orderBy: {
          departmentCategoryName: 'asc',
        },
      });
    });

    it('should throw UnAuthorizedError when sellerId is not provided', async () => {
      await expect(
        service.getDepartmentCategoriesByDepartmentId(1),
      ).rejects.toThrow(UnAuthorizedError);
    });

    it('should throw InternalServerError when database error occurs', async () => {
      mockPrismaService.departmentCategory.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.getDepartmentCategoriesByDepartmentId(1, 'seller-123'),
      ).rejects.toThrow(InternalServerError);
      await expect(
        service.getDepartmentCategoriesByDepartmentId(1, 'seller-123'),
      ).rejects.toThrow('Error al obtener las categorías de departamento.');
    });
  });

  describe('getProductCategoriesByDepartmentCategoryId', () => {
    const mockProductCategories = [
      {
        id: 1,
        productCategoryName: 'Smartphones',
        departmentCategoryId: 1,
        keywords: ['phone', 'mobile'],
        size: 'SMALL',
        averageWeight: 0.2,
        weightUnit: 'KG',
        href: '/smartphones',
        materials: [
          {
            id: 1,
            material: {
              id: 1,
              materialType: 'Plastic',
              estimatedCo2SavingsKG: 2.5,
              estimatedWaterSavingsLT: 10.0,
            },
          },
        ],
      },
    ];

    it('should return product categories with materials when sellerId is provided', async () => {
      mockPrismaService.productCategory.findMany.mockResolvedValue(
        mockProductCategories,
      );

      const result = await service.getProductCategoriesByDepartmentCategoryId(
        1,
        'seller-123',
      );

      expect(result).toEqual(mockProductCategories);
      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith({
        where: {
          departmentCategoryId: 1,
        },
        include: {
          materials: {
            include: {
              material: true,
            },
          },
        },
        orderBy: {
          productCategoryName: 'asc',
        },
      });
    });

    it('should throw UnAuthorizedError when sellerId is not provided', async () => {
      await expect(
        service.getProductCategoriesByDepartmentCategoryId(1),
      ).rejects.toThrow(UnAuthorizedError);
    });

    it('should throw InternalServerError when database error occurs', async () => {
      mockPrismaService.productCategory.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.getProductCategoriesByDepartmentCategoryId(1, 'seller-123'),
      ).rejects.toThrow(InternalServerError);
      await expect(
        service.getProductCategoriesByDepartmentCategoryId(1, 'seller-123'),
      ).rejects.toThrow('Error al obtener las categorías de productos.');
    });
  });

  describe('getDepartment', () => {
    const mockDepartment = {
      id: 1,
      departmentName: 'Electronics',
      departmentImage: 'electronics.jpg',
      href: '/electronics',
      departmentCategory: [
        {
          id: 1,
          departmentCategoryName: 'Phones',
          departmentId: 1,
          href: '/phones',
          productCategory: [
            {
              id: 1,
              productCategoryName: 'Smartphones',
              departmentCategoryId: 1,
              keywords: ['phone'],
              size: 'SMALL',
              averageWeight: 0.2,
              weightUnit: 'KG',
              href: '/smartphones',
              _count: { product: 10 },
            },
          ],
        },
      ],
    };

    const mockProducts = [
      {
        id: 1,
        productName: 'iPhone 13',
        price: 999.99,
        isActive: true,
        deletedAt: null,
      },
      {
        id: 2,
        productName: 'Samsung Galaxy',
        price: 899.99,
        isActive: true,
        deletedAt: null,
      },
    ];

    it('should return department with paginated products', async () => {
      mockPrismaService.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrismaService.product.count.mockResolvedValue(2);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getDepartment(1, 1, 20);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('products');
      expect(result.products).toHaveProperty('nodes');
      expect(result.products).toHaveProperty('pageInfo');
      expect(result.products.nodes).toHaveLength(2);
      expect(mockPrismaService.department.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundError when department does not exist', async () => {
      mockPrismaService.department.findUnique.mockResolvedValue(null);

      await expect(service.getDepartment(999)).rejects.toThrow(NotFoundError);
      await expect(service.getDepartment(999)).rejects.toThrow(
        'Departamento no encontrado.',
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrismaService.product.count.mockResolvedValue(50);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      await service.getDepartment(1, 2, 10);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should throw InternalServerError when database error occurs', async () => {
      mockPrismaService.department.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getDepartment(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getDepartmentCategories', () => {
    const mockDepartmentCategories = [
      {
        id: 1,
        departmentCategoryName: 'Phones',
        departmentId: 1,
        href: '/phones',
        productCategory: [],
      },
    ];

    it('should return paginated department categories', async () => {
      mockPrismaService.departmentCategory.count.mockResolvedValue(1);
      mockPrismaService.departmentCategory.findMany.mockResolvedValue(
        mockDepartmentCategories,
      );

      const result = await service.getDepartmentCategories(1, 1, 20);

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('pageInfo');
      expect(result.nodes).toHaveLength(1);
      expect(mockPrismaService.departmentCategory.count).toHaveBeenCalledWith({
        where: { departmentId: 1 },
      });
    });

    it('should handle pagination parameters correctly', async () => {
      mockPrismaService.departmentCategory.count.mockResolvedValue(50);
      mockPrismaService.departmentCategory.findMany.mockResolvedValue([]);

      await service.getDepartmentCategories(1, 3, 10);

      expect(
        mockPrismaService.departmentCategory.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('should throw InternalServerError when database error occurs', async () => {
      mockPrismaService.departmentCategory.count.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getDepartmentCategories(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getDepartmentCategory', () => {
    const mockDepartmentCategory = {
      id: 1,
      departmentCategoryName: 'Phones',
      departmentId: 1,
      href: '/phones',
      department: {
        id: 1,
        departmentName: 'Electronics',
        departmentImage: 'electronics.jpg',
        href: '/electronics',
      },
      productCategory: [
        {
          id: 1,
          productCategoryName: 'Smartphones',
          departmentCategoryId: 1,
          keywords: ['phone'],
          size: 'SMALL',
          averageWeight: 0.2,
          weightUnit: 'KG',
          href: '/smartphones',
          materials: [],
          _count: { product: 5 },
        },
      ],
    };

    const mockProducts = [
      {
        id: 1,
        productName: 'iPhone 13',
        price: 999.99,
        isActive: true,
        deletedAt: null,
      },
    ];

    it('should return department category with paginated products', async () => {
      mockPrismaService.departmentCategory.findUnique.mockResolvedValue(
        mockDepartmentCategory,
      );
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getDepartmentCategory(1, 1, 20);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('products');
      expect(result.products).toHaveProperty('nodes');
      expect(result.products.nodes).toHaveLength(1);
    });

    it('should throw NotFoundError when department category does not exist', async () => {
      mockPrismaService.departmentCategory.findUnique.mockResolvedValue(null);

      await expect(service.getDepartmentCategory(999)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getDepartmentCategory(999)).rejects.toThrow(
        'Categoría de departamento no encontrada.',
      );
    });

    it('should throw InternalServerError when database error occurs', async () => {
      mockPrismaService.departmentCategory.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getDepartmentCategory(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getProductCategories', () => {
    const mockProductCategories = [
      {
        id: 1,
        productCategoryName: 'Smartphones',
        departmentCategoryId: 1,
        keywords: ['phone'],
        size: 'SMALL',
        averageWeight: 0.2,
        weightUnit: 'KG',
        href: '/smartphones',
        materials: [
          {
            id: 1,
            productCategoryId: 1,
            materialTypeId: 1,
            quantity: 50,
            unit: 'PERCENT',
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            material: {
              id: 1,
              materialType: 'Plastic',
              estimatedCo2SavingsKG: 2.5,
              estimatedWaterSavingsLT: 10.0,
            },
          },
        ],
        _count: { product: 10 },
      },
    ];

    it('should return paginated product categories with materials', async () => {
      mockPrismaService.productCategory.count.mockResolvedValue(1);
      mockPrismaService.productCategory.findMany.mockResolvedValue(
        mockProductCategories,
      );

      const result = await service.getProductCategories(1, 1, 20);

      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('pageInfo');
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toHaveProperty('materials');
      expect(mockPrismaService.productCategory.count).toHaveBeenCalledWith({
        where: { departmentCategoryId: 1 },
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.productCategory.count.mockResolvedValue(30);
      mockPrismaService.productCategory.findMany.mockResolvedValue([]);

      await service.getProductCategories(1, 2, 15);

      expect(mockPrismaService.productCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 15,
        }),
      );
    });

    it('should throw InternalServerError when database error occurs', async () => {
      mockPrismaService.productCategory.count.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getProductCategories(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getProductCategory', () => {
    const mockProductCategory = {
      id: 1,
      productCategoryName: 'Smartphones',
      departmentCategoryId: 1,
      keywords: ['phone', 'mobile'],
      size: 'SMALL',
      averageWeight: 0.2,
      weightUnit: 'KG',
      href: '/smartphones',
      departmentCategory: {
        id: 1,
        departmentCategoryName: 'Phones',
        departmentId: 1,
        href: '/phones',
        department: {
          id: 1,
          departmentName: 'Electronics',
          departmentImage: 'electronics.jpg',
          href: '/electronics',
        },
      },
      materials: [
        {
          id: 1,
          productCategoryId: 1,
          materialTypeId: 1,
          quantity: 50,
          unit: 'PERCENT',
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          material: {
            id: 1,
            materialType: 'Plastic',
            estimatedCo2SavingsKG: 2.5,
            estimatedWaterSavingsLT: 10.0,
          },
        },
      ],
    };

    const mockProducts = [
      {
        id: 1,
        productName: 'iPhone 13',
        productCategoryId: 1,
        price: 999.99,
        isActive: true,
        deletedAt: null,
      },
    ];

    it('should return product category with paginated products', async () => {
      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        mockProductCategory,
      );
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getProductCategory(1, 1, 20);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('productCategoryName', 'Smartphones');
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('materials');
      expect(result.products).toHaveProperty('nodes');
      expect(result.products.nodes).toHaveLength(1);
    });

    it('should throw NotFoundError when product category does not exist', async () => {
      mockPrismaService.productCategory.findUnique.mockResolvedValue(null);

      await expect(service.getProductCategory(999)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getProductCategory(999)).rejects.toThrow(
        'Categoría de producto no encontrada.',
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        mockProductCategory,
      );
      mockPrismaService.product.count.mockResolvedValue(100);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.getProductCategory(1, 3, 25);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            productCategoryId: 1,
            isActive: true,
            deletedAt: null,
          },
          skip: 50,
          take: 25,
        }),
      );
    });

    it('should throw InternalServerError when database error occurs', async () => {
      mockPrismaService.productCategory.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getProductCategory(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });
});
