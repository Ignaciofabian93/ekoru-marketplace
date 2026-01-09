import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Impact Repository
 *
 * Handles data access for environmental impact calculations.
 * Fetches product category materials and their impact estimates.
 */
@Injectable()
export class ImpactRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all materials and their impact data for a product category
   */
  async getProductCategoryMaterials(productCategoryId: number) {
    return this.prisma.productCategoryMaterial.findMany({
      where: {
        productCategoryId,
      },
      include: {
        material: true,
      },
    });
  }

  /**
   * Get material impact estimate by ID
   */
  async getMaterialImpactById(materialTypeId: number) {
    return this.prisma.materialImpactEstimate.findUnique({
      where: {
        id: materialTypeId,
      },
    });
  }
}
