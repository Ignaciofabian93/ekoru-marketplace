import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import {
  createProductCategoryTranslationLoader,
  createProductCategoriesByDepartmentCategoryLoader,
} from './dataloaders';
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
   */
  createTranslationLoader(): DataLoader<
    string,
    ProductCategoryTranslation | null
  > {
    return createProductCategoryTranslationLoader(this.prisma);
  }

  /**
   * Creates a DataLoader for product categories by department category ID
   */
  createProductCategoryByCategoryLoader(): DataLoader<
    number,
    ProductCategory[]
  > {
    return createProductCategoriesByDepartmentCategoryLoader(this.prisma);
  }

  /**
   * Finds a product category by slug and language
   *
   * @example
   * const productCategory = await findBySlug('led-grande', Language.ES);
   */
  async findBySlug(
    slug: string,
    language: Language,
  ): Promise<ProductCategory | null> {
    try {
      const translation =
        await this.prisma.productCategoryTranslation.findUnique({
          where: {
            slug_language: {
              slug,
              language,
            },
          },
          include: {
            productCategory: true,
          },
        });

      return translation?.productCategory || null;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding product category by slug: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds a product category by its ID
   */
  async findById(id: number): Promise<ProductCategory | null> {
    try {
      return await this.prisma.productCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding product category by id: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all active product categories with page-based pagination
   *
   * @param {number} page - 1-based page number
   * @param {number} pageSize - Number of product categories per page
   */
  async findAll(page: number, pageSize: number): Promise<ProductCategory[]> {
    try {
      return await this.prisma.productCategory.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding all product categories: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all product categories for a specific department category
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
      const err = error as Error;
      this.logger.error(
        `Error finding product categories by category: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a product category using DataLoader
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
