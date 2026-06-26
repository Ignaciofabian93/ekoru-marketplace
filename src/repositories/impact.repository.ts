import { Injectable } from '@nestjs/common';
import type { Language } from '@prisma/client';
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
   * Get all materials and their impact data for a product category.
   *
   * When `language` is provided, each material's translations are filtered to
   * that language so the caller can resolve a localized material name without
   * an extra round-trip.
   */
  async getProductCategoryMaterials(
    productCategoryId: number,
    language?: Language,
  ) {
    return this.prisma.productCategoryMaterial.findMany({
      where: {
        productCategoryId,
      },
      include: {
        material: {
          include: {
            translations: language ? { where: { language } } : true,
          },
        },
      },
    });
  }

  /**
   * Get the average weight (and its unit) configured for a product category.
   *
   * Material impact estimates are stored *per kilogram*, so the caller needs
   * the product's typical mass to scale them into a real-world total.
   */
  async getProductCategoryWeight(productCategoryId: number) {
    return this.prisma.productCategory.findUnique({
      where: {
        id: productCategoryId,
      },
      select: {
        averageWeight: true,
        weightUnit: true,
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
