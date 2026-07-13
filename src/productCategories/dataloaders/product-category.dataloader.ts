import { Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ProductCategory,
  ProductCategoryTranslation,
} from '../../types/product-category';
import type { Language } from '@prisma/client';

const logger = new Logger('ProductCategoryDataLoader');

/**
 * Creates a DataLoader for product category translations with composite key (id + language)
 *
 * @example
 * const loader = createProductCategoryTranslationLoader(prisma);
 * const translation = await loader.load('1:ES');
 */
export function createProductCategoryTranslationLoader(
  prisma: PrismaService,
): DataLoader<string, ProductCategoryTranslation | null> {
  return new DataLoader<string, ProductCategoryTranslation | null>(
    async (compositeKeys: readonly string[]) => {
      try {
        // Parse composite keys: "productCategoryId:language"
        const keyPairs = compositeKeys.map((key) => {
          const [idStr, language] = key.split(':');
          return {
            productCategoryId: parseInt(idStr, 10),
            language: language as Language,
          };
        });

        // Batch load all translations
        const translations = await prisma.productCategoryTranslation.findMany({
          where: {
            OR: keyPairs.map(({ productCategoryId, language }) => ({
              productCategoryId,
              language,
            })),
          },
        });

        // Create a map for O(1) lookup
        const translationMap = new Map<string, ProductCategoryTranslation>();
        translations.forEach((translation) => {
          const key = `${translation.productCategoryId}:${translation.language}`;
          translationMap.set(key, translation);
        });

        // Return results in the same order as requested keys
        return compositeKeys.map((key) => translationMap.get(key) || null);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading product category translations: ${err.message}`,
          err.stack,
        );
        throw error;
      }
    },
    {
      cacheKeyFn: (key: string) => key,
    },
  );
}

/**
 * Creates a DataLoader for product categories grouped by department category ID
 *
 * @example
 * const loader = createProductCategoriesByDepartmentCategoryLoader(prisma);
 * const productCategories = await loader.load(1);
 */
export function createProductCategoriesByDepartmentCategoryLoader(
  prisma: PrismaService,
): DataLoader<number, ProductCategory[]> {
  return new DataLoader<number, ProductCategory[]>(
    async (categoryIds: readonly number[]) => {
      try {
        const productCategories = await prisma.productCategory.findMany({
          where: {
            departmentCategoryId: {
              in: [...categoryIds],
            },
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        });

        // Group product categories by department category ID
        const productCategoryMap = new Map<number, ProductCategory[]>();
        productCategories.forEach((productCategory) => {
          const existing =
            productCategoryMap.get(productCategory.departmentCategoryId) || [];
          productCategoryMap.set(productCategory.departmentCategoryId, [
            ...existing,
            productCategory,
          ]);
        });

        // Return results in the same order as requested category IDs
        return categoryIds.map((id) => productCategoryMap.get(id) || []);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading product categories: ${err.message}`,
          err.stack,
        );
        throw error;
      }
    },
  );
}
