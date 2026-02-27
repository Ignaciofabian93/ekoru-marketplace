import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { I18nService } from '../common/i18n';
import { CategoryRepository } from '../repositories';
import { DepartmentCategory } from '../types/category';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly i18nService: I18nService,
  ) {}

  /**
   * Gets a department category by its slug
   *
   * @param {string} slug - The department category slug
   * @param {Language} language - The language for translation (optional, uses context if not provided)
   * @returns {Promise<DepartmentCategory>} The department category
   * @throws {NotFoundException} If department category is not found
   *
   * @example
   * const dept = await getDepartmentBySlug('tecnologia', Language.ES);
   */
  async getDepartmentCategoryBySlug(
    slug: string,
    language: Language,
  ): Promise<DepartmentCategory> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Getting department category by slug: ${slug}, language: ${lang}`,
    );

    const category = await this.categoryRepository.findBySlug(slug, lang);

    if (!category) {
      throw new NotFoundException(
        `Department category with slug '${slug}' not found for language '${lang}'`,
      );
    }

    return category;
  }

  /**
   * Gets all departments with pagination
   *
   * @param {number} limit - Maximum number of departments to return (default: 20)
   * @param {number} offset - Number of departments to skip (default: 0)
   * @param {Language} language - The language for translations (optional, uses context if not provided)
   * @returns {Promise<Department[]>} Array of departments
   *
   * @example
   * const departments = await getDepartments(10, 0, Language.ES);
   */
  async getDepartmentCategories(
    limit: number = 20,
    offset: number = 0,
    language?: Language,
  ): Promise<DepartmentCategory[]> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Getting department categories: limit=${limit}, offset=${offset}, language=${lang}`,
    );

    if (limit <= 0 || offset < 0) {
      throw new Error(
        'Invalid pagination parameters: limit must be > 0 and offset must be >= 0',
      );
    }

    const categories = await this.categoryRepository.findAll(limit, offset);

    this.logger.debug(`Retrieved ${categories.length} department categories`);

    return categories;
  }
}
