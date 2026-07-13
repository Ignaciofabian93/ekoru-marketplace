import { Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../../prisma/prisma.service';
import type { Department, DepartmentTranslation } from '../../types/department';
import type { Language } from '@prisma/client';

const logger = new Logger('DepartmentDataLoader');

/**
 * Creates a DataLoader for department translations with composite key (id + language)
 *
 * @example
 * const loader = createDepartmentTranslationLoader(prisma);
 * const translation = await loader.load('1:ES');
 */
export function createDepartmentTranslationLoader(
  prisma: PrismaService,
): DataLoader<string, DepartmentTranslation | null> {
  return new DataLoader<string, DepartmentTranslation | null>(
    async (compositeKeys: readonly string[]) => {
      try {
        // Parse composite keys: "departmentId:language"
        const keyPairs = compositeKeys.map((key) => {
          const [idStr, language] = key.split(':');
          return {
            departmentId: parseInt(idStr, 10),
            language: language as Language,
          };
        });

        // Batch load all translations
        const translations = await prisma.departmentTranslation.findMany({
          where: {
            OR: keyPairs.map(({ departmentId, language }) => ({
              departmentId,
              language,
            })),
          },
        });

        // Create a map for O(1) lookup
        const translationMap = new Map<string, DepartmentTranslation>();
        translations.forEach((translation) => {
          const key = `${translation.departmentId}:${translation.language}`;
          translationMap.set(key, translation);
        });

        // Return results in the same order as requested keys
        return compositeKeys.map((key) => translationMap.get(key) || null);
      } catch (error) {
        const err = error as Error;
        logger.error(
          `Error loading department translations: ${err.message}`,
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
 * Creates a DataLoader for departments by ID
 *
 * @example
 * const loader = createDepartmentByIdLoader(prisma);
 * const department = await loader.load(1);
 */
export function createDepartmentByIdLoader(
  prisma: PrismaService,
): DataLoader<number, Department | null> {
  return new DataLoader<number, Department | null>(
    async (ids: readonly number[]) => {
      try {
        const departments = await prisma.department.findMany({
          where: {
            id: {
              in: [...ids],
            },
          },
        });

        const departmentMap = new Map<number, Department>();
        departments.forEach((dept) => {
          departmentMap.set(dept.id, dept);
        });

        return ids.map((id) => departmentMap.get(id) || null);
      } catch (error) {
        const err = error as Error;
        logger.error(`Error loading departments: ${err.message}`, err.stack);
        throw error;
      }
    },
  );
}
