import { Injectable, Logger } from '@nestjs/common';
import type { Language } from '@prisma/client';
import { ImpactRepository } from '../repositories/impact.repository';
import {
  EnvironmentalImpactEntity,
  MaterialBreakdown,
} from '../products/entities/environmental-impact.entity';

/**
 * Turns a raw material key like "ELECTRONIC_COMPONENTS" into a render-ready
 * "Electronic components". Used as a fallback when no translation row exists,
 * so the frontend never has to display a SCREAMING_SNAKE_CASE enum.
 */
function humanizeMaterialType(value: string): string {
  const normalized = value.replace(/_/g, ' ').trim().toLowerCase();
  if (!normalized) return value;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Impact Service
 *
 * Calculates environmental impact for product categories based on
 * their material composition and impact estimates.
 */
@Injectable()
export class ImpactService {
  private readonly logger = new Logger(ImpactService.name);

  constructor(private readonly impactRepository: ImpactRepository) {}

  /**
   * Calculate total environmental impact for a product category
   *
   * Aggregates CO2 and water savings across all materials in the category
   * based on their quantities and impact estimates.
   */
  async calculateCategoryImpact(
    productCategoryId: number,
    language?: Language,
  ): Promise<EnvironmentalImpactEntity | null> {
    try {
      // Get all materials for this product category (translations filtered to
      // `language` when supplied, so we can resolve a localized name below).
      const categoryMaterials =
        await this.impactRepository.getProductCategoryMaterials(
          productCategoryId,
          language,
        );

      if (!categoryMaterials || categoryMaterials.length === 0) {
        this.logger.debug(
          `No materials found for category ${productCategoryId}`,
        );
        return null;
      }

      let totalCo2SavingsKG = 0;
      let totalWaterSavingsLT = 0;
      const materialBreakdown: MaterialBreakdown[] = [];

      // Calculate impact for each material
      for (const categoryMaterial of categoryMaterials) {
        if (!categoryMaterial.material) {
          this.logger.warn(
            `Material ${categoryMaterial.materialTypeId} has no impact data`,
          );
          continue;
        }

        const material = categoryMaterial.material;
        const quantity = categoryMaterial.quantity;

        // Calculate impact based on quantity
        // Assuming the estimates are per unit (e.g., per kg or per 100%)
        const multiplier =
          categoryMaterial.unit === 'percentage' ? quantity / 100 : quantity;

        const co2Savings = material.estimatedCo2SavingsKG * multiplier;
        const waterSavings = material.estimatedWaterSavingsLT * multiplier;

        totalCo2SavingsKG += co2Savings;
        totalWaterSavingsLT += waterSavings;

        // Prefer the localized name for the request language; fall back to a
        // humanized form of the raw key so the FE never renders "PLASTIC".
        const translations = (
          material as {
            translations?: {
              language: Language;
              materialTypeTranslation: string;
            }[];
          }
        ).translations;
        const translated = language
          ? translations?.find((t) => t.language === language)
              ?.materialTypeTranslation
          : undefined;

        materialBreakdown.push({
          materialType: material.materialType,
          materialTypeLabel:
            translated ?? humanizeMaterialType(material.materialType),
          quantity: categoryMaterial.quantity,
          unit: categoryMaterial.unit,
          co2SavingsKG: co2Savings,
          waterSavingsLT: waterSavings,
        });
      }

      return {
        totalCo2SavingsKG: Math.round(totalCo2SavingsKG * 100) / 100, // Round to 2 decimals
        totalWaterSavingsLT: Math.round(totalWaterSavingsLT * 100) / 100,
        materialBreakdown,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating impact for category ${productCategoryId}:`,
        error,
      );
      return null;
    }
  }
}
