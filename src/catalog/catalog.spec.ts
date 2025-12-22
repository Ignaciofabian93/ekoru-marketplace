import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceCatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

describe('MarketplaceCatalogService', () => {
  let service: MarketplaceCatalogService;
  let prismaService: PrismaService;

  const mockDepartments = [
    {
      id: 1,
      departmentName: 'Electronics',
      href: '/electronics',
      departmentCategory: [
        {
          id: 1,
          departmentCategoryName: 'Computers',
          href: '/electronics/computers',
          productCategory: [
            {
              id: 1,
              productCategoryName: 'Laptops',
              departmentCategoryId: 1,
              href: '/electronics/computers/laptops',
            },
            {
              id: 2,
              productCategoryName: 'Desktops',
              departmentCategoryId: 1,
              href: '/electronics/computers/desktops',
            },
          ],
        },
        {
          id: 2,
          departmentCategoryName: 'Mobile Phones',
          href: '/electronics/mobile-phones',
          productCategory: [
            {
              id: 3,
              productCategoryName: 'Smartphones',
              departmentCategoryId: 2,
              href: '/electronics/mobile-phones/smartphones',
            },
          ],
        },
      ],
    },
    {
      id: 2,
      departmentName: 'Home & Garden',
      href: '/home-garden',
      departmentCategory: [
        {
          id: 3,
          departmentCategoryName: 'Furniture',
          href: '/home-garden/furniture',
          productCategory: [
            {
              id: 4,
              productCategoryName: 'Living Room',
              departmentCategoryId: 3,
              href: '/home-garden/furniture/living-room',
            },
          ],
        },
      ],
    },
  ];

  const mockPrismaService = {
    department: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceCatalogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MarketplaceCatalogService>(MarketplaceCatalogService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMarketplaceCatalog', () => {
    it('should return departments with categories and products', async () => {
      mockPrismaService.department.findMany.mockResolvedValue(mockDepartments);

      const result = await service.getMarketplaceCatalog();

      expect(result).toEqual(mockDepartments);
      expect(prismaService.department.findMany).toHaveBeenCalledTimes(1);
      expect(prismaService.department.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          departmentName: true,
          href: true,
          departmentCategory: {
            select: {
              id: true,
              departmentCategoryName: true,
              href: true,
              productCategory: {
                select: {
                  id: true,
                  productCategoryName: true,
                  departmentCategoryId: true,
                  href: true,
                },
              },
            },
          },
        },
        orderBy: {
          departmentName: 'asc',
        },
      });
    });

    it('should return departments sorted alphabetically by name', async () => {
      const sortedDepartments = [...mockDepartments].sort((a, b) =>
        a.departmentName.localeCompare(b.departmentName),
      );
      mockPrismaService.department.findMany.mockResolvedValue(
        sortedDepartments,
      );

      const result = await service.getMarketplaceCatalog();

      expect(result[0].departmentName).toBe('Electronics');
      expect(result[1].departmentName).toBe('Home & Garden');
    });

    it('should throw NotFoundError when no departments are found', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([]);

      await expect(service.getMarketplaceCatalog()).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getMarketplaceCatalog()).rejects.toThrow(
        'No se encontraron departamentos',
      );
    });

    it('should throw NotFoundError when departments array is empty', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([]);

      await expect(service.getMarketplaceCatalog()).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw InternalServerError when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.department.findMany.mockRejectedValue(dbError);

      await expect(service.getMarketplaceCatalog()).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.getMarketplaceCatalog()).rejects.toThrow(
        'Error al obtener el catálogo marketplace',
      );
    });

    it('should throw InternalServerError for unexpected errors', async () => {
      mockPrismaService.department.findMany.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(service.getMarketplaceCatalog()).rejects.toThrow(
        InternalServerError,
      );
    });

    it('should re-throw NotFoundError without wrapping it', async () => {
      const notFoundError = new NotFoundError('Custom not found message');
      mockPrismaService.department.findMany.mockRejectedValue(notFoundError);

      await expect(service.getMarketplaceCatalog()).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getMarketplaceCatalog()).rejects.toThrow(
        'Custom not found message',
      );
    });

    it('should include all department fields in the response', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([
        mockDepartments[0],
      ]);

      const result = await service.getMarketplaceCatalog();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('departmentName');
      expect(result[0]).toHaveProperty('href');
      expect(result[0]).toHaveProperty('departmentCategory');
    });

    it('should include all department category fields in nested data', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([
        mockDepartments[0],
      ]);

      const result = await service.getMarketplaceCatalog();
      const category = result[0].departmentCategory[0];

      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('departmentCategoryName');
      expect(category).toHaveProperty('href');
      expect(category).toHaveProperty('productCategory');
    });

    it('should include all product category fields in nested data', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([
        mockDepartments[0],
      ]);

      const result = await service.getMarketplaceCatalog();
      const productCategory =
        result[0].departmentCategory[0].productCategory[0];

      expect(productCategory).toHaveProperty('id');
      expect(productCategory).toHaveProperty('productCategoryName');
      expect(productCategory).toHaveProperty('departmentCategoryId');
      expect(productCategory).toHaveProperty('href');
    });

    it('should handle departments with multiple categories', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([
        mockDepartments[0],
      ]);

      const result = await service.getMarketplaceCatalog();

      expect(result[0].departmentCategory).toHaveLength(2);
      expect(result[0].departmentCategory[0].departmentCategoryName).toBe(
        'Computers',
      );
      expect(result[0].departmentCategory[1].departmentCategoryName).toBe(
        'Mobile Phones',
      );
    });

    it('should handle categories with multiple products', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([
        mockDepartments[0],
      ]);

      const result = await service.getMarketplaceCatalog();
      const category = result[0].departmentCategory[0];

      expect(category.productCategory).toHaveLength(2);
      expect(category.productCategory[0].productCategoryName).toBe('Laptops');
      expect(category.productCategory[1].productCategoryName).toBe('Desktops');
    });

    it('should handle departments with empty categories array', async () => {
      const departmentWithNoCategories = [
        {
          id: 3,
          departmentName: 'Empty Department',
          href: '/empty',
          departmentCategory: [],
        },
      ];
      mockPrismaService.department.findMany.mockResolvedValue(
        departmentWithNoCategories,
      );

      const result = await service.getMarketplaceCatalog();

      expect(result[0].departmentCategory).toEqual([]);
    });

    it('should handle categories with empty products array', async () => {
      const departmentWithEmptyCategory = [
        {
          id: 3,
          departmentName: 'Test Department',
          href: '/test',
          departmentCategory: [
            {
              id: 10,
              departmentCategoryName: 'Empty Category',
              href: '/test/empty',
              productCategory: [],
            },
          ],
        },
      ];
      mockPrismaService.department.findMany.mockResolvedValue(
        departmentWithEmptyCategory,
      );

      const result = await service.getMarketplaceCatalog();

      expect(result[0].departmentCategory[0].productCategory).toEqual([]);
    });

    it('should log error when exception occurs', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      const dbError = new Error('Database error');
      mockPrismaService.department.findMany.mockRejectedValue(dbError);

      await expect(service.getMarketplaceCatalog()).rejects.toThrow();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error al obtener el catálogo marketplace:',
        dbError,
      );
    });

    it('should handle null or undefined database response gracefully', async () => {
      mockPrismaService.department.findMany.mockResolvedValue(null);

      await expect(service.getMarketplaceCatalog()).rejects.toThrow();
    });

    it('should return correct structure with single department', async () => {
      mockPrismaService.department.findMany.mockResolvedValue([
        mockDepartments[0],
      ]);

      const result = await service.getMarketplaceCatalog();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].departmentName).toBe('Electronics');
    });

    it('should return correct structure with multiple departments', async () => {
      mockPrismaService.department.findMany.mockResolvedValue(mockDepartments);

      const result = await service.getMarketplaceCatalog();

      expect(result).toHaveLength(2);
      expect(result[0].departmentName).toBe('Electronics');
      expect(result[1].departmentName).toBe('Home & Garden');
    });
  });
});
