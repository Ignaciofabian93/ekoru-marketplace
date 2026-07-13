import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import {
  createDepartmentCategoryTranslationLoader,
  createDepartmentCategoriesByDepartmentLoader,
} from './dataloaders';
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
export class DepartmentCategoryRepository {
  private readonly logger = new Logger(DepartmentCategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for department category translations with composite key (id + language)
   */
  createTranslationLoader(): DataLoader<
    string,
    DepartmentCategoryTranslation | null
  > {
    return createDepartmentCategoryTranslationLoader(this.prisma);
  }

  /**
   * Creates a DataLoader for department categories by department ID
   */
  createCategoryByDepartmentLoader(): DataLoader<number, DepartmentCategory[]> {
    return createDepartmentCategoriesByDepartmentLoader(this.prisma);
  }

  /**
   * Finds a department category by slug and language
   *
   * @example
   * const category = await findBySlug('television', Language.ES);
   */
  async findBySlug(
    slug: string,
    language: Language,
  ): Promise<DepartmentCategory | null> {
    try {
      const translation =
        await this.prisma.departmentCategoryTranslation.findUnique({
          where: {
            slug_language: {
              slug,
              language,
            },
          },
          include: {
            departmentCategory: true,
          },
        });

      return translation?.departmentCategory || null;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding category by slug: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds a department category by its ID
   */
  async findById(id: number): Promise<DepartmentCategory | null> {
    try {
      return await this.prisma.departmentCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding category by id: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all active department categories with page-based pagination
   *
   * @param {number} page - 1-based page number
   * @param {number} pageSize - Number of categories per page
   */
  async findAll(page: number, pageSize: number): Promise<DepartmentCategory[]> {
    try {
      return await this.prisma.departmentCategory.findMany({
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
        `Error finding all categories: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all categories for a specific department
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
      const err = error as Error;
      this.logger.error(
        `Error finding categories by department: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a department category using DataLoader
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
