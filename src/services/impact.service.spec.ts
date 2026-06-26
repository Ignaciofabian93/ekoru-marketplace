import { Test, TestingModule } from '@nestjs/testing';
import { ImpactService } from './impact.service';
import { ImpactRepository } from '../repositories/impact.repository';

describe('ImpactService', () => {
  let service: ImpactService;
  let repository: ImpactRepository;

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

  const mockRepository = {
    getProductCategoryMaterials: jest.fn(),
    getMaterialImpactById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpactService,
        {
          provide: ImpactRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ImpactService>(ImpactService);
    repository = module.get<ImpactRepository>(ImpactRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateCategoryImpact', () => {
    it('should calculate impact for a single material', async () => {
      mockRepository.getProductCategoryMaterials.mockResolvedValue([
        mockCategoryMaterial,
      ]);

      const result = await service.calculateCategoryImpact(1);

      expect(result).toEqual({
        totalCo2SavingsKG: 4.4, // 5.5 * (80/100) = 4.4
        totalWaterSavingsLT: 16.0, // 20.0 * (80/100) = 16.0
        materialBreakdown: [
          {
            materialType: 'Plastic',
            materialTypeLabel: 'Plastic', // humanized fallback (no translation)
            quantity: 80,
            unit: 'percentage',
            co2SavingsKG: 4.4,
            waterSavingsLT: 16.0,
          },
        ],
      });
      expect(repository.getProductCategoryMaterials).toHaveBeenCalledWith(
        1,
        undefined,
      );
    });

    it('should use the localized translation for the requested language', async () => {
      const translatedMaterial = {
        ...mockCategoryMaterial,
        material: {
          ...mockMaterialImpact,
          materialType: 'PLASTIC',
          translations: [
            { language: 'ES', materialTypeTranslation: 'Plástico' },
          ],
        },
      };
      mockRepository.getProductCategoryMaterials.mockResolvedValue([
        translatedMaterial,
      ]);

      const result = await service.calculateCategoryImpact(1, 'ES' as never);

      expect(result?.materialBreakdown[0]).toMatchObject({
        materialType: 'PLASTIC',
        materialTypeLabel: 'Plástico',
      });
      expect(repository.getProductCategoryMaterials).toHaveBeenCalledWith(
        1,
        'ES',
      );
    });

    it('should humanize SCREAMING_SNAKE_CASE keys when no translation exists', async () => {
      const snakeMaterial = {
        ...mockCategoryMaterial,
        material: {
          ...mockMaterialImpact,
          materialType: 'ELECTRONIC_COMPONENTS',
          translations: [],
        },
      };
      mockRepository.getProductCategoryMaterials.mockResolvedValue([
        snakeMaterial,
      ]);

      const result = await service.calculateCategoryImpact(1, 'EN' as never);

      expect(result?.materialBreakdown[0].materialTypeLabel).toBe(
        'Electronic components',
      );
    });

    it('should calculate impact for multiple materials', async () => {
      const material2 = {
        ...mockCategoryMaterial,
        id: 2,
        materialTypeId: 2,
        quantity: 20,
        material: {
          id: 2,
          materialType: 'Metal',
          estimatedCo2SavingsKG: 10.0,
          estimatedWaterSavingsLT: 30.0,
        },
      };

      mockRepository.getProductCategoryMaterials.mockResolvedValue([
        mockCategoryMaterial,
        material2,
      ]);

      const result = await service.calculateCategoryImpact(1);

      expect(result?.totalCo2SavingsKG).toBe(6.4); // 4.4 + 2.0
      expect(result?.totalWaterSavingsLT).toBe(22.0); // 16.0 + 6.0
      expect(result?.materialBreakdown).toHaveLength(2);
    });

    it('should handle absolute quantity units', async () => {
      const absoluteMaterial = {
        ...mockCategoryMaterial,
        quantity: 2.5,
        unit: 'kg',
      };

      mockRepository.getProductCategoryMaterials.mockResolvedValue([
        absoluteMaterial,
      ]);

      const result = await service.calculateCategoryImpact(1);

      expect(result?.totalCo2SavingsKG).toBe(13.75); // 5.5 * 2.5
      expect(result?.totalWaterSavingsLT).toBe(50.0); // 20.0 * 2.5
    });

    it('should return null when no materials found', async () => {
      mockRepository.getProductCategoryMaterials.mockResolvedValue([]);

      const result = await service.calculateCategoryImpact(1);

      expect(result).toBeNull();
    });

    it('should skip materials without impact data', async () => {
      const materialWithoutImpact = {
        ...mockCategoryMaterial,
        material: null,
      };

      mockRepository.getProductCategoryMaterials.mockResolvedValue([
        materialWithoutImpact,
      ]);

      const result = await service.calculateCategoryImpact(1);

      expect(result).toEqual({
        totalCo2SavingsKG: 0,
        totalWaterSavingsLT: 0,
        materialBreakdown: [],
      });
    });

    it('should round results to 2 decimal places', async () => {
      const material = {
        ...mockCategoryMaterial,
        quantity: 33.333,
        material: {
          id: 1,
          materialType: 'Plastic',
          estimatedCo2SavingsKG: 1.111,
          estimatedWaterSavingsLT: 2.222,
        },
      };

      mockRepository.getProductCategoryMaterials.mockResolvedValue([material]);

      const result = await service.calculateCategoryImpact(1);

      // 1.111 * (33.333/100) = 0.37037 -> 0.37
      expect(result?.totalCo2SavingsKG).toBe(0.37);
      // 2.222 * (33.333/100) = 0.74074 -> 0.74
      expect(result?.totalWaterSavingsLT).toBe(0.74);
    });

    it('should return null and log error on exception', async () => {
      mockRepository.getProductCategoryMaterials.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result).toBeNull();
    });
  });
});
