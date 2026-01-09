import { Test, TestingModule } from '@nestjs/testing';
import { ImpactRepository } from './impact.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('ImpactRepository', () => {
  let repository: ImpactRepository;
  let prismaService: PrismaService;

  const mockMaterialImpact = {
    id: 1,
    materialType: 'Plastic',
    estimatedCo2SavingsKG: 5.5,
    estimatedWaterSavingsLT: 20.0,
  };

  const mockCategoryMaterial = {
    id: 1,
    productCategoryId: 1,
    materialTypeId: 1,
    quantity: 80,
    unit: 'percentage',
    isPrimary: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    material: mockMaterialImpact,
  };

  const mockPrismaService = {
    productCategoryMaterial: {
      findMany: jest.fn(),
    },
    materialImpactEstimate: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpactRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ImpactRepository>(ImpactRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductCategoryMaterials', () => {
    it('should return materials for a product category', async () => {
      mockPrismaService.productCategoryMaterial.findMany.mockResolvedValue([
        mockCategoryMaterial,
      ]);

      const result = await repository.getProductCategoryMaterials(1);

      expect(result).toEqual([mockCategoryMaterial]);
      expect(
        prismaService.productCategoryMaterial.findMany,
      ).toHaveBeenCalledWith({
        where: {
          productCategoryId: 1,
        },
        include: {
          material: true,
        },
      });
    });

    it('should return empty array when no materials found', async () => {
      mockPrismaService.productCategoryMaterial.findMany.mockResolvedValue([]);

      const result = await repository.getProductCategoryMaterials(999);

      expect(result).toEqual([]);
    });
  });

  describe('getMaterialImpactById', () => {
    it('should return material impact by id', async () => {
      mockPrismaService.materialImpactEstimate.findUnique.mockResolvedValue(
        mockMaterialImpact,
      );

      const result = await repository.getMaterialImpactById(1);

      expect(result).toEqual(mockMaterialImpact);
      expect(
        prismaService.materialImpactEstimate.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it('should return null when material not found', async () => {
      mockPrismaService.materialImpactEstimate.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.getMaterialImpactById(999);

      expect(result).toBeNull();
    });
  });
});
