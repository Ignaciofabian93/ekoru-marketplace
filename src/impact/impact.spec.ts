import { Test, TestingModule } from '@nestjs/testing';
import { ImpactService } from './impact.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

describe('ImpactService', () => {
  let service: ImpactService;

  const mockPrismaService = {
    materialImpactEstimate: {
      findMany: jest.fn(),
    },
    co2ImpactMessage: {
      findMany: jest.fn(),
    },
    waterImpactMessage: {
      findMany: jest.fn(),
    },
    productCategory: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpactService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ImpactService>(ImpactService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMaterialImpacts', () => {
    const mockMaterials = [
      {
        id: 1,
        materialType: 'Plastic',
        estimatedCo2SavingsKG: 2.5,
        estimatedWaterSavingsLT: 10.0,
      },
      {
        id: 2,
        materialType: 'Metal',
        estimatedCo2SavingsKG: 3.0,
        estimatedWaterSavingsLT: 15.0,
      },
    ];

    it('should return all material impacts ordered by materialType', async () => {
      mockPrismaService.materialImpactEstimate.findMany.mockResolvedValue(
        mockMaterials,
      );

      const result = await service.getMaterialImpacts();

      expect(result).toEqual(mockMaterials);
      expect(
        mockPrismaService.materialImpactEstimate.findMany,
      ).toHaveBeenCalledWith({
        select: {
          id: true,
          materialType: true,
          estimatedCo2SavingsKG: true,
          estimatedWaterSavingsLT: true,
        },
        orderBy: {
          materialType: 'asc',
        },
      });
    });

    it('should throw NotFoundError when no materials are found', async () => {
      mockPrismaService.materialImpactEstimate.findMany.mockResolvedValue([]);

      await expect(service.getMaterialImpacts()).rejects.toThrow(NotFoundError);
      await expect(service.getMaterialImpacts()).rejects.toThrow(
        'No se encontraron materiales con datos de impacto.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.materialImpactEstimate.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getMaterialImpacts()).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.getMaterialImpacts()).rejects.toThrow(
        'Error al obtener los datos de impacto de materiales',
      );
    });
  });

  describe('getAllCo2ImpactMessages', () => {
    const mockMessages = [
      {
        id: 1,
        min: 0,
        max: 10,
        message: 'Low impact',
      },
      {
        id: 2,
        min: 10,
        max: 50,
        message: 'Medium impact',
      },
    ];

    it('should return all CO2 impact messages ordered by min', async () => {
      mockPrismaService.co2ImpactMessage.findMany.mockResolvedValue(
        mockMessages,
      );

      const result = await service.getAllCo2ImpactMessages();

      expect(result).toEqual(mockMessages);
      expect(mockPrismaService.co2ImpactMessage.findMany).toHaveBeenCalledWith({
        orderBy: {
          min: 'asc',
        },
      });
    });

    it('should throw NotFoundError when no messages are found', async () => {
      mockPrismaService.co2ImpactMessage.findMany.mockResolvedValue([]);

      await expect(service.getAllCo2ImpactMessages()).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getAllCo2ImpactMessages()).rejects.toThrow(
        'No se encontraron mensajes de impacto de CO2.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.co2ImpactMessage.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getAllCo2ImpactMessages()).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.getAllCo2ImpactMessages()).rejects.toThrow(
        'Error al obtener los mensajes de impacto de CO2',
      );
    });
  });

  describe('getAllWaterImpactMessages', () => {
    const mockMessages = [
      {
        id: 1,
        min: 0,
        max: 100,
        message: 'Low water impact',
      },
      {
        id: 2,
        min: 100,
        max: 500,
        message: 'Medium water impact',
      },
    ];

    it('should return all water impact messages ordered by min', async () => {
      mockPrismaService.waterImpactMessage.findMany.mockResolvedValue(
        mockMessages,
      );

      const result = await service.getAllWaterImpactMessages();

      expect(result).toEqual(mockMessages);
      expect(
        mockPrismaService.waterImpactMessage.findMany,
      ).toHaveBeenCalledWith({
        orderBy: {
          min: 'asc',
        },
      });
    });

    it('should throw NotFoundError when no messages are found', async () => {
      mockPrismaService.waterImpactMessage.findMany.mockResolvedValue([]);

      await expect(service.getAllWaterImpactMessages()).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getAllWaterImpactMessages()).rejects.toThrow(
        'No se encontraron mensajes de impacto de agua.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.waterImpactMessage.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getAllWaterImpactMessages()).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.getAllWaterImpactMessages()).rejects.toThrow(
        'Error al obtener los mensajes de impacto de agua',
      );
    });
  });

  describe('calculateCategoryImpact', () => {
    const mockCategoryWithMaterials = {
      id: 1,
      averageWeight: 100,
      materials: [
        {
          id: 1,
          productCategoryId: 1,
          materialTypeId: 1,
          quantity: 60,
          unit: 'percentage',
          isPrimary: true,
          material: {
            id: 1,
            materialType: 'Plastic',
            estimatedCo2SavingsKG: 2.5,
            estimatedWaterSavingsLT: 10.0,
          },
        },
        {
          id: 2,
          productCategoryId: 1,
          materialTypeId: 2,
          quantity: 40,
          unit: 'percentage',
          isPrimary: false,
          material: {
            id: 2,
            materialType: 'Metal',
            estimatedCo2SavingsKG: 3.0,
            estimatedWaterSavingsLT: 15.0,
          },
        },
      ],
    };

    it('should calculate impact for category with percentage-based materials', async () => {
      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        mockCategoryWithMaterials,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result).toEqual({
        totalCo2SavingsKG: 270.0,
        totalWaterSavingsLT: 1200.0,
        materialBreakdown: [
          {
            materialType: 'Plastic',
            percentage: 60,
            weightKG: 60,
            co2SavingsKG: 150.0,
            waterSavingsLT: 600.0,
          },
          {
            materialType: 'Metal',
            percentage: 40,
            weightKG: 40,
            co2SavingsKG: 120.0,
            waterSavingsLT: 600.0,
          },
        ],
      });
      expect(mockPrismaService.productCategory.findUnique).toHaveBeenCalledWith(
        {
          where: { id: 1 },
          include: {
            materials: {
              include: {
                material: true,
              },
            },
          },
        },
      );
    });

    it('should calculate impact for category with weight-based materials', async () => {
      const categoryWithWeightMaterials = {
        ...mockCategoryWithMaterials,
        averageWeight: 100,
        materials: [
          {
            id: 1,
            productCategoryId: 1,
            materialTypeId: 1,
            quantity: 50,
            unit: 'kg',
            isPrimary: true,
            material: {
              id: 1,
              materialType: 'Plastic',
              estimatedCo2SavingsKG: 2.0,
              estimatedWaterSavingsLT: 8.0,
            },
          },
        ],
      };

      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        categoryWithWeightMaterials,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result).toEqual({
        totalCo2SavingsKG: 100.0,
        totalWaterSavingsLT: 400.0,
        materialBreakdown: [
          {
            materialType: 'Plastic',
            percentage: 50,
            weightKG: 50,
            co2SavingsKG: 100.0,
            waterSavingsLT: 400.0,
          },
        ],
      });
    });

    it('should return zero impact for category without materials', async () => {
      const categoryWithoutMaterials = {
        id: 1,
        averageWeight: 100,
        materials: [],
      };

      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        categoryWithoutMaterials,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result).toEqual({
        totalCo2SavingsKG: 0,
        totalWaterSavingsLT: 0,
        materialBreakdown: [],
      });
    });

    it('should handle category with zero average weight', async () => {
      const categoryWithZeroWeight = {
        id: 1,
        averageWeight: 0,
        materials: [
          {
            id: 1,
            productCategoryId: 1,
            materialTypeId: 1,
            quantity: 60,
            unit: 'percentage',
            isPrimary: true,
            material: {
              id: 1,
              materialType: 'Plastic',
              estimatedCo2SavingsKG: 2.5,
              estimatedWaterSavingsLT: 10.0,
            },
          },
        ],
      };

      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        categoryWithZeroWeight,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result.totalCo2SavingsKG).toBe(0);
      expect(result.totalWaterSavingsLT).toBe(0);
    });

    it('should handle category with null average weight', async () => {
      const categoryWithNullWeight = {
        id: 1,
        averageWeight: null,
        materials: [
          {
            id: 1,
            productCategoryId: 1,
            materialTypeId: 1,
            quantity: 60,
            unit: 'percentage',
            isPrimary: true,
            material: {
              id: 1,
              materialType: 'Plastic',
              estimatedCo2SavingsKG: 2.5,
              estimatedWaterSavingsLT: 10.0,
            },
          },
        ],
      };

      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        categoryWithNullWeight,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result.totalCo2SavingsKG).toBe(0);
      expect(result.totalWaterSavingsLT).toBe(0);
    });

    it('should throw NotFoundError when category does not exist', async () => {
      mockPrismaService.productCategory.findUnique.mockResolvedValue(null);

      await expect(service.calculateCategoryImpact(999)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.calculateCategoryImpact(999)).rejects.toThrow(
        'Categoría de producto no encontrada.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.productCategory.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.calculateCategoryImpact(1)).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.calculateCategoryImpact(1)).rejects.toThrow(
        'Error al calcular el impacto ambiental',
      );
    });

    it('should properly round decimal values to 2 places', async () => {
      const categoryWithDecimalResults = {
        id: 1,
        averageWeight: 100,
        materials: [
          {
            id: 1,
            productCategoryId: 1,
            materialTypeId: 1,
            quantity: 33.33,
            unit: 'percentage',
            isPrimary: true,
            material: {
              id: 1,
              materialType: 'Plastic',
              estimatedCo2SavingsKG: 2.5555,
              estimatedWaterSavingsLT: 10.1234,
            },
          },
        ],
      };

      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        categoryWithDecimalResults,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result.totalCo2SavingsKG).toBe(85.18);
      expect(result.totalWaterSavingsLT).toBe(337.41);
    });
  });
});
