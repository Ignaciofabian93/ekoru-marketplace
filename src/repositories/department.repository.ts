import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import type { Department, DepartmentTranslation } from '../types/department';
import type { Language } from '@prisma/client';

/**
 * Department Repository - Handles data loading for departments and their translations
 *
 * This repository implements the DataLoader pattern to efficiently batch and cache
 * database queries for departments and their translations, preventing N+1 query problems.
 */
@Injectable()
export class DepartmentRepository {
  private readonly logger = new Logger(DepartmentRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for department translations with composite key (id + language)
   *
   * @returns {DataLoader<string, DepartmentTranslation | null>} DataLoader instance
   *
   * @example
   * const loader = createTranslationLoader();
   * const translation = await loader.load('1:ES');
   */
  createTranslationLoader(): DataLoader<string, DepartmentTranslation | null> {
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
          const translations = await this.prisma.departmentTranslation.findMany(
            {
              where: {
                OR: keyPairs.map(({ departmentId, language }) => ({
                  departmentId,
                  language,
                })),
              },
            },
          );

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
          this.logger.error(
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
   * @returns {DataLoader<number, Department | null>} DataLoader instance
   */
  createDepartmentLoader(): DataLoader<number, Department | null> {
    return new DataLoader<number, Department | null>(
      async (ids: readonly number[]) => {
        try {
          const departments = await this.prisma.department.findMany({
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
          this.logger.error(
            `Error loading departments: ${err.message}`,
            err.stack,
          );
          throw error;
        }
      },
    );
  }

  /**
   * Finds a department by slug and language
   *
   * @param {string} slug - The department slug
   * @param {Language} language - The language for translation
   * @returns {Promise<Department | null>} The department with its translation
   *
   * @example
   * const dept = await findBySlug('tecnologia', Language.ES);
   */
  async findBySlug(
    slug: string,
    language: Language,
  ): Promise<Department | null> {
    try {
      const translation = await this.prisma.departmentTranslation.findUnique({
        where: {
          slug_language: {
            slug,
            language,
          },
        },
        include: {
          department: true,
        },
      });

      return translation?.department || null;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding department by slug: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a department using DataLoader
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {number} departmentId - The department ID
   * @param {Language} language - The language for translation
   * @returns {Promise<DepartmentTranslation | null>} The translation or null
   */
  async getTranslation(
    loader: DataLoader<string, DepartmentTranslation | null>,
    departmentId: number,
    language: Language,
  ): Promise<DepartmentTranslation | null> {
    const key = `${departmentId}:${language}`;
    return loader.load(key);
  }

  /**
   * Primes the DataLoader cache with translations for multiple departments
   * Useful for warming up the cache before resolving nested fields
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {number[]} departmentIds - Array of department IDs
   * @param {Language} language - The language for translations
   * @returns {Promise<void>}
   */
  async primeTranslations(
    loader: DataLoader<string, DepartmentTranslation | null>,
    departmentIds: number[],
    language: Language,
  ): Promise<void> {
    const keys = departmentIds.map((id) => `${id}:${language}`);
    await loader.loadMany(keys);
  }

  /**
   * Finds all departments with pagination
   *
   * @param {number} limit - Maximum number of departments to return
   * @param {number} offset - Number of departments to skip
   * @returns {Promise<Department[]>} Array of departments
   */
  async findAll(limit: number, offset: number): Promise<Department[]> {
    try {
      return await this.prisma.department.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding all departments: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }
}
