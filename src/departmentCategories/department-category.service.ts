import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Language } from '../graphql/enums';
import { DepartmentCategoryRepository } from './department-category.repository';
import { I18nDepartmentCategoryService } from './i18n';
import { ProductsService } from '../products/products.service';
import {
  ProductFilterInput,
  ProductSortInput,
} from '../products/dto/product.input';
import type { DepartmentCategory } from '../types/category';

type BaseParams = {
  language: Language;
};

type ListParams = BaseParams & {
  page?: number | null;
  pageSize?: number | null;
};

type ProductQueryParams = ListParams & {
  filter?: ProductFilterInput;
  sort?: ProductSortInput;
  excludeSellerId?: string;
};

/**
 * Department Category Service - Business logic for department category operations
 */
@Injectable()
export class DepartmentCategoryService {
  private readonly logger = new Logger(DepartmentCategoryService.name);

  constructor(
    private readonly departmentCategoryRepository: DepartmentCategoryRepository,
    private readonly i18nService: I18nDepartmentCategoryService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Gets all department categories with page-based pagination
   *
   * @example
   * const categories = await getDepartmentCategories({ page: 1, pageSize: 20, language: Language.ES });
   */
  async getDepartmentCategories({
    page = 1,
    pageSize = 20,
    language,
  }: ListParams): Promise<DepartmentCategory[]> {
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.logger.debug(
      `Getting department categories: page=${currentPage}, pageSize=${currentPageSize}, language=${language}`,
    );

    this.validatePagination(currentPage, currentPageSize, language);

    const categories = await this.departmentCategoryRepository.findAll(
      currentPage,
      currentPageSize,
    );

    this.logger.debug(`Retrieved ${categories.length} department categories`);

    return categories;
  }

  /**
   * Gets a department category by its ID (admin panel)
   *
   * @throws {NotFoundException} If department category is not found
   */
  async getDepartmentCategoryById({
    id,
    language,
  }: BaseParams & { id: number }): Promise<DepartmentCategory> {
    this.logger.debug(
      `Getting department category by id: ${id}, language: ${language}`,
    );

    const category = await this.departmentCategoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(
        this.i18nService.translate('errors.category_not_found_id', language, {
          id: String(id),
        }),
      );
    }

    return category;
  }

  /**
   * Gets a department category by its slug (web browsing)
   *
   * @throws {NotFoundException} If department category is not found
   *
   * @example
   * const category = await getDepartmentCategoryBySlug({ slug: 'television', language: Language.ES });
   */
  async getDepartmentCategoryBySlug({
    slug,
    language,
  }: BaseParams & { slug: string }): Promise<DepartmentCategory> {
    this.logger.debug(
      `Getting department category by slug: ${slug}, language: ${language}`,
    );

    const category = await this.departmentCategoryRepository.findBySlug(
      slug,
      language,
    );

    if (!category) {
      throw new NotFoundException(
        this.i18nService.translate('errors.category_not_found', language, {
          slug,
        }),
      );
    }

    return category;
  }

  /**
   * Gets a department category by slug together with the paginated list of
   * every product under it (web browsing). The category's translation and
   * product categories are resolved through the DepartmentCategory field
   * resolvers, so clients can select only `products` when paginating.
   */
  async getDepartmentCategoryProductsBySlug({
    slug,
    language,
    page = 1,
    pageSize = 20,
    filter,
    sort,
    excludeSellerId,
  }: ProductQueryParams & { slug: string }) {
    this.logger.debug(
      `Getting department category products by slug: ${slug}, page=${page}, pageSize=${pageSize}`,
    );

    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.validatePagination(currentPage, currentPageSize, language);

    const departmentCategory = await this.getDepartmentCategoryBySlug({
      slug,
      language,
    });

    const products = await this.productsService.getProductsByDepartmentCategory(
      {
        departmentCategoryId: departmentCategory.id,
        page: currentPage,
        pageSize: currentPageSize,
        filter,
        sort,
        excludeSellerId,
      },
    );

    return {
      departmentCategory,
      products,
    };
  }

  /**
   * Validates page-based pagination parameters (page >= 1, 1 <= pageSize <= 100)
   */
  private validatePagination(
    page: number,
    pageSize: number,
    language: Language,
  ): void {
    if (page < 1) {
      throw new BadRequestException(
        this.i18nService.translate('errors.invalid_page', language),
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException(
        this.i18nService.translate('errors.page_size_out_of_range', language, {
          min: '1',
          max: '100',
        }),
      );
    }
  }
}
