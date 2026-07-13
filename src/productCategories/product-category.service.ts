import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Language } from '../graphql/enums';
import { ProductCategoryRepository } from './product-category.repository';
import { I18nProductCategoryService } from './i18n';
import { ProductsService } from '../products/products.service';
import {
  ProductFilterInput,
  ProductSortInput,
} from '../products/dto/product.input';
import type { ProductCategory } from '../types/product-category';

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
 * Product Category Service - Business logic for product category operations
 */
@Injectable()
export class ProductCategoryService {
  private readonly logger = new Logger(ProductCategoryService.name);

  constructor(
    private readonly productCategoryRepository: ProductCategoryRepository,
    private readonly i18nService: I18nProductCategoryService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Gets all product categories with page-based pagination
   *
   * @example
   * const productCategories = await getProductCategories({ page: 1, pageSize: 20, language: Language.ES });
   */
  async getProductCategories({
    page = 1,
    pageSize = 20,
    language,
  }: ListParams): Promise<ProductCategory[]> {
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.logger.debug(
      `Getting product categories: page=${currentPage}, pageSize=${currentPageSize}, language=${language}`,
    );

    this.validatePagination(currentPage, currentPageSize, language);

    const productCategories = await this.productCategoryRepository.findAll(
      currentPage,
      currentPageSize,
    );

    this.logger.debug(`Fetched ${productCategories.length} product categories`);

    return productCategories;
  }

  /**
   * Gets a product category by its ID (admin panel)
   *
   * @throws {NotFoundException} If product category is not found
   */
  async getProductCategoryById({
    id,
    language,
  }: BaseParams & { id: number }): Promise<ProductCategory> {
    this.logger.debug(
      `Getting product category by id: ${id}, language: ${language}`,
    );

    const productCategory = await this.productCategoryRepository.findById(id);

    if (!productCategory) {
      throw new NotFoundException(
        this.i18nService.translate(
          'errors.product_category_not_found_id',
          language,
          { id: String(id) },
        ),
      );
    }

    return productCategory;
  }

  /**
   * Gets a product category by its slug (web browsing)
   *
   * @throws {NotFoundException} If product category is not found
   *
   * @example
   * const productCategory = await getProductCategoryBySlug({ slug: 'led-grande', language: Language.ES });
   */
  async getProductCategoryBySlug({
    slug,
    language,
  }: BaseParams & { slug: string }): Promise<ProductCategory> {
    this.logger.debug(
      `Getting product category by slug: ${slug}, language: ${language}`,
    );

    const productCategory = await this.productCategoryRepository.findBySlug(
      slug,
      language,
    );

    if (!productCategory) {
      throw new NotFoundException(
        this.i18nService.translate(
          'errors.product_category_not_found',
          language,
          { slug },
        ),
      );
    }

    return productCategory;
  }

  /**
   * Gets a product category by slug together with its paginated products
   * (web browsing). The category's translation is resolved through the
   * ProductCategory field resolvers, so clients can select only `products`
   * when paginating.
   */
  async getProductCategoryProductsBySlug({
    slug,
    language,
    page = 1,
    pageSize = 20,
    filter,
    sort,
    excludeSellerId,
  }: ProductQueryParams & { slug: string }) {
    this.logger.debug(
      `Getting product category products by slug: ${slug}, page=${page}, pageSize=${pageSize}`,
    );

    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.validatePagination(currentPage, currentPageSize, language);

    const productCategory = await this.getProductCategoryBySlug({
      slug,
      language,
    });

    const products = await this.productsService.getProductsByCategory({
      productCategoryId: productCategory.id,
      page: currentPage,
      pageSize: currentPageSize,
      filter,
      sort,
      excludeSellerId,
    });

    return {
      productCategory,
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
