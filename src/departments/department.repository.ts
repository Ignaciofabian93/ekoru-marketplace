import { Injectable, Logger } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import {
  createDepartmentTranslationLoader,
  createDepartmentByIdLoader,
} from './dataloaders';
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
   */
  createTranslationLoader(): DataLoader<string, DepartmentTranslation | null> {
    return createDepartmentTranslationLoader(this.prisma);
  }

  /**
   * Creates a DataLoader for departments by ID
   */
  createDepartmentLoader(): DataLoader<number, Department | null> {
    return createDepartmentByIdLoader(this.prisma);
  }

  /**
   * Finds a department by slug and language (web browsing)
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
   * Finds a department by its ID (admin panel)
   */
  async findById(id: number): Promise<Department | null> {
    try {
      return await this.prisma.department.findUnique({
        where: { id },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error finding department by id: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Finds all active departments with page-based pagination
   *
   * @param {number} page - 1-based page number
   * @param {number} pageSize - Number of departments per page
   */
  async findAll(page: number, pageSize: number): Promise<Department[]> {
    try {
      return await this.prisma.department.findMany({
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
        `Error finding all departments: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Gets a single translation for a department using DataLoader
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
   */
  async primeTranslations(
    loader: DataLoader<string, DepartmentTranslation | null>,
    departmentIds: number[],
    language: Language,
  ): Promise<void> {
    const keys = departmentIds.map((id) => `${id}:${language}`);
    await loader.loadMany(keys);
  }
}
