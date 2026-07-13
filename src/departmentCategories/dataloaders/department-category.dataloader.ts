import { Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  DepartmentCategory,
  DepartmentCategoryTranslation,
} from '../../types/category';
import type { Language } from '@prisma/client';

const logger = new Logger('DepartmentCategoryDataLoader');

/**
 * Creates a DataLoader for department category translations with composite key (id + language)
 *
 * @example
 * const loader = createDepartmentCategoryTranslationLoader(prisma);
 * const translation = await loader.load('1:ES');
 */
export function createDepartmentCategoryTranslationLoader(
  prisma: PrismaService,
): DataLoader<string, DepartmentCategoryTranslation | null> {
  return new DataLoader<string, DepartmentCategoryTranslation | null>(
    async (compositeKeys: readonly string[]) => {
      try {
        // Parse composite keys: "departmentCategoryId:language"
        const keyPairs = compositeKeys.map((key) => {
          const [idStr, language] = key.split(':');
          return {
            departmentCategoryId: parseInt(idStr, 10),
            language: language as Language,
          };
        });

        // Batch load all translations
        const translations =
          await prisma.departmentCategoryTranslation.findMany({
            where: {
              OR: keyPairs.map(({ departmentCategoryId, language }) => ({
                departmentCategoryId,
                language,
              })),
            },
          });

        // Create a map for O(1) lookup
        const translationMap = new Map<string, DepartmentCategoryTranslation>();
        translations.forEach((translation) => {
          const key = `${translation.departmentCategoryId}:${translation.language}`;
          translationMap.set(key, translation);
        });

        // Return results in the same order as requested keys
        return compositeKeys.map((key) => translationMap.get(key) || null);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading department category translations: ${err.message}`,
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
 * Creates a DataLoader for department categories grouped by department ID
 *
 * @example
 * const loader = createDepartmentCategoriesByDepartmentLoader(prisma);
 * const categories = await loader.load(1);
 */
export function createDepartmentCategoriesByDepartmentLoader(
  prisma: PrismaService,
): DataLoader<number, DepartmentCategory[]> {
  return new DataLoader<number, DepartmentCategory[]>(
    async (departmentIds: readonly number[]) => {
      try {
        const categories = await prisma.departmentCategory.findMany({
          where: {
            departmentId: {
              in: [...departmentIds],
            },
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        });

        // Group categories by department ID
        const categoryMap = new Map<number, DepartmentCategory[]>();
        categories.forEach((category) => {
          const existing = categoryMap.get(category.departmentId) || [];
          categoryMap.set(category.departmentId, [...existing, category]);
        });

        // Return results in the same order as requested department IDs
        return departmentIds.map((id) => categoryMap.get(id) || []);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading department categories: ${err.message}`,
          err.stack,
        );
        throw error;
      }
    },
  );
}
