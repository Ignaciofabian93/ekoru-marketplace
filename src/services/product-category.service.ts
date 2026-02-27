import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { I18nService } from '../common/i18n';
import { ProductCategoryRepository } from '../repositories';
import { ProductCategory } from '../types/product-category';

@Injectable()
export class ProductCategoryService {
  private readonly logger = new Logger(ProductCategoryService.name);

  constructor(
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly i18nService: I18nService,
  ) {}

  /**
   * Gets a department by its slug
   *
   * @param {string} slug - The department slug
   * @param {Language} language - The language for translation (optional, uses context if not provided)
   * @returns {Promise<ProductCategory>} The department
   * @throws {NotFoundException} If department is not found
   *
   * @example
   * const dept = await getProductCategoryBySlug('led-grande', Language.ES);
   */
  async getProductCategoryBySlug(
    slug: string,
    language?: Language,
  ): Promise<ProductCategory> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Getting product category by slug: ${slug}, language: ${lang}`,
    );

    const productCategory = await this.productCategoryRepository.findBySlug(
      slug,
      lang,
    );

    if (!productCategory) {
      throw new NotFoundException(
        `Product category with slug '${slug}' not found for language '${lang}'`,
      );
    }

    return productCategory;
  }

  /**
   * Gets all product categories with pagination
   *
   * @param {number} limit - Maximum number of product categories to return (default: 20)
   * @param {number} offset - Number of product categories to skip (default: 0)
   * @param {Language} language - The language for translations (optional, uses context if not provided)
   * @returns {Promise<ProductCategory[]>} Array of product categories
   *
   * @example
   * const productCategories = await getProductCategories(10, 0, Language.ES);
   */
  async getProductCategories(
    limit: number,
    offset: number,
    language?: Language,
  ): Promise<ProductCategory[]> {
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(
      `Getting product categories: limit=${limit}, offset=${offset}, language=${lang}`,
    );

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    const productCategories = await this.productCategoryRepository.findAll(
      limit,
      offset,
    );

    this.logger.debug(`Fetched ${productCategories.length} product categories`);

    return productCategories;
  }
}
