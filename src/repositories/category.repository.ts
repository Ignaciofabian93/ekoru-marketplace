import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import type {
  DepartmentCategory,
  DepartmentCategoryTranslation,
} from '../types/category';
import type { Language } from '@prisma/client';

/**
 * Department Category Repository - Handles data loading for department categories and their translations
 *
 * This repository implements the DataLoader pattern to efficiently batch and cache
 * database queries for department categories and their translations.
 */
@Injectable()
export class CategoryRepository {
  private readonly logger = new Logger(CategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for department category translations with composite key (id + language)
   *
   * @returns {DataLoader<string, DepartmentCategoryTranslation | null>} DataLoader instance
   *
   * @example
   * const loader = createTranslationLoader();
   * const translation = await loader.load('1:ES');
   */
  createTranslationLoader(): DataLoader<
    string,
    DepartmentCategoryTranslation | null
  > {
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
            await this.prisma.departmentCategoryTranslation.findMany({
              where: {
                OR: keyPairs.map(({ departmentCategoryId, language }) => ({
                  departmentCategoryId,
                  language,
                })),
              },
            });

          // Create a map for O(1) lookup
          const translationMap = new Map<
            string,
            DepartmentCategoryTranslation
          >();
          translations.forEach((translation) => {
            const key = `${translation.departmentCategoryId}:${translation.language}`;
            translationMap.set(key, translation);
          });

          // Return results in the same order as requested keys
          return compositeKeys.map((key) => translationMap.get(key) || null);
        } catch (error) {
          this.logger.error(
            `Error loading department category translations: ${error.message}`,
            error.stack,
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
   * Creates a DataLoader for department categories by department ID
   *
   * @returns {DataLoader<number, DepartmentCategory[]>} DataLoader instance
   *
   * @example
   * const loader = createCategoryByDepartmentLoader();
   * const categories = await loader.load(1);
   */
  createCategoryByDepartmentLoader(): DataLoader<number, DepartmentCategory[]> {
    return new DataLoader<number, DepartmentCategory[]>(
      async (departmentIds: readonly number[]) => {
        try {
          const categories = await this.prisma.departmentCategory.findMany({
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
          this.logger.error(
            `Error loading department categories: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      },
    );
  }

  /**
   * Finds a department category by slug and language
   *
   * @param {string} slug - The department category slug
   * @param {Language} language - The language for translation
   * @returns {Promise<DepartmentCategory | null>} The department category with its translation
   *
   * @example
   * const dept = await findBySlug('televisor', Language.ES);
   */
  async findBySlug(
    slug: string,
    language: Language,
  ): Promise<DepartmentCategory | null> {
    try {
      const translation =
        await this.prisma.departmentCategoryTranslation.findFirst({
          where: {
            slug,
            language,
          },
          include: {
            departmentCategory: true,
          },
        });

      return translation?.departmentCategory || null;
    } catch (error) {
      this.logger.error(
        `Error finding category by slug: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all departments with pagination
   *
   * @param {number} limit - Maximum number of departments to return
   * @param {number} offset - Number of departments to skip
   * @returns {Promise<DepartmentCategory[]>} Array of departments
   */
  async findAll(limit: number, offset: number): Promise<DepartmentCategory[]> {
    try {
      return await this.prisma.departmentCategory.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        skip: offset,
        take: limit,
      });
    } catch (error) {
      this.logger.error(
        `Error finding all categories: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all categories for a specific department
   *
   * @param {number} departmentId - The department ID
   * @returns {Promise<DepartmentCategory[]>} Array of categories
   */
  async findByDepartmentId(
    departmentId: number,
  ): Promise<DepartmentCategory[]> {
    try {
      return await this.prisma.departmentCategory.findMany({
        where: {
          departmentId,
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(
        `Error finding categories by department: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a department category using DataLoader
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {number} categoryId - The category ID
   * @param {Language} language - The language for translation
   * @returns {Promise<DepartmentCategoryTranslation | null>} The translation or null
   */
  async getTranslation(
    loader: DataLoader<string, DepartmentCategoryTranslation | null>,
    categoryId: number,
    language: Language,
  ): Promise<DepartmentCategoryTranslation | null> {
    const key = `${categoryId}:${language}`;
    return loader.load(key);
  }

  /**
   * Primes the DataLoader cache with translations for multiple categories
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {number[]} categoryIds - Array of category IDs
   * @param {Language} language - The language for translations
   * @returns {Promise<void>}
   */
  async primeTranslations(
    loader: DataLoader<string, DepartmentCategoryTranslation | null>,
    categoryIds: number[],
    language: Language,
  ): Promise<void> {
    const keys = categoryIds.map((id) => `${id}:${language}`);
    await loader.loadMany(keys);
  }
}
