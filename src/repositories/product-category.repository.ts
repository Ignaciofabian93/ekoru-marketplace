import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ProductCategory,
  ProductCategoryTranslation,
} from '../types/product-category';
import type { Language } from '@prisma/client';

/**
 * Product Category Repository - Handles data loading for product categories and their translations
 *
 * This repository implements the DataLoader pattern to efficiently batch and cache
 * database queries for product categories and their translations.
 */
@Injectable()
export class ProductCategoryRepository {
  private readonly logger = new Logger(ProductCategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for product category translations with composite key (id + language)
   *
   * @returns {DataLoader<string, ProductCategoryTranslation | null>} DataLoader instance
   *
   * @example
   * const loader = createTranslationLoader();
   * const translation = await loader.load('1:ES');
   */
  createTranslationLoader(): DataLoader<
    string,
    ProductCategoryTranslation | null
  > {
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
          const translations =
            await this.prisma.productCategoryTranslation.findMany({
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
          this.logger.error(
            `Error loading product category translations: ${error.message}`,
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
   * Creates a DataLoader for product categories by department category ID
   *
   * @returns {DataLoader<number, ProductCategory[]>} DataLoader instance
   *
   * @example
   * const loader = createProductCategoryByCategoryLoader();
   * const productCategories = await loader.load(1);
   */
  createProductCategoryByCategoryLoader(): DataLoader<
    number,
    ProductCategory[]
  > {
    return new DataLoader<number, ProductCategory[]>(
      async (categoryIds: readonly number[]) => {
        try {
          const productCategories = await this.prisma.productCategory.findMany({
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
              productCategoryMap.get(productCategory.departmentCategoryId) ||
              [];
            productCategoryMap.set(productCategory.departmentCategoryId, [
              ...existing,
              productCategory,
            ]);
          });

          // Return results in the same order as requested category IDs
          return categoryIds.map((id) => productCategoryMap.get(id) || []);
        } catch (error) {
          this.logger.error(
            `Error loading product categories: ${error.message}`,
            error.stack,
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
   * @returns {Promise<ProductCategory | null>} The department with its translation
   *
   * @example
   * const dept = await findBySlug('led-grande', Language.ES);
   */
  async findBySlug(
    slug: string,
    language: Language,
  ): Promise<ProductCategory | null> {
    try {
      const translation =
        await this.prisma.productCategoryTranslation.findFirst({
          where: {
            slug,
            language,
          },
          include: {
            productCategory: true,
          },
        });

      return translation?.productCategory || null;
    } catch (error) {
      this.logger.error(
        `Error finding product category by slug: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all product categories with pagination
   *
   * @param {number} limit - Maximum number of product categories to return
   * @param {number} offset - Number of product categories to skip
   * @returns {Promise<ProductCategory[]>} Array of product categories
   */
  async findAll(limit: number, offset: number): Promise<ProductCategory[]> {
    try {
      return await this.prisma.productCategory.findMany({
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
        `Error finding all product categories: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all product categories for a specific department category
   *
   * @param {number} categoryId - The department category ID
   * @returns {Promise<ProductCategory[]>} Array of product categories
   */
  async findByCategoryId(categoryId: number): Promise<ProductCategory[]> {
    try {
      return await this.prisma.productCategory.findMany({
        where: {
          departmentCategoryId: categoryId,
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
    } catch (error) {
      this.logger.error(
        `Error finding product categories by category: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a product category using DataLoader
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {productCategoryId} productCategoryId - The product category ID
   * @param {Language} language - The language for translation
   * @returns {Promise<ProductCategoryTranslation | null>} The translation or null
   */
  async getTranslation(
    loader: DataLoader<string, ProductCategoryTranslation | null>,
    productCategoryId: number,
    language: Language,
  ): Promise<ProductCategoryTranslation | null> {
    const key = `${productCategoryId}:${language}`;
    return loader.load(key);
  }

  /**
   * Primes the DataLoader cache with translations for multiple product categories
   *
   * @param {DataLoader} loader - The translation DataLoader
   * @param {number[]} productCategoryIds - Array of product category IDs
   * @param {Language} language - The language for translations
   * @returns {Promise<void>}
   */
  async primeTranslations(
    loader: DataLoader<string, ProductCategoryTranslation | null>,
    productCategoryIds: number[],
    language: Language,
  ): Promise<void> {
    const keys = productCategoryIds.map((id) => `${id}:${language}`);
    await loader.loadMany(keys);
  }
}
