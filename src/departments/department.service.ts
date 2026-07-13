import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Language } from '../graphql/enums';
import { DepartmentRepository } from './department.repository';
import { I18nDepartmentService } from './i18n';
import { ProductsService } from '../products/products.service';
import {
  ProductFilterInput,
  ProductSortInput,
} from '../products/dto/product.input';
import type { Department } from '../types/department';

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
 * Department Service - Business logic for department operations
 *
 * This service provides high-level operations for departments, coordinating
 * between repositories and applying business rules.
 *
 * Lookup conventions:
 * - by slug → web browsing (e.g. /technology)
 * - by id   → admin panel
 */
@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly i18nService: I18nDepartmentService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Gets all departments with page-based pagination
   *
   * @example
   * const departments = await getDepartments({ page: 1, pageSize: 20, language: Language.ES });
   */
  async getDepartments({
    page = 1,
    pageSize = 20,
    language,
  }: ListParams): Promise<Department[]> {
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.logger.debug(
      `Getting departments: page=${currentPage}, pageSize=${currentPageSize}, language=${language}`,
    );

    this.validatePagination(currentPage, currentPageSize, language);

    const departments = await this.departmentRepository.findAll(
      currentPage,
      currentPageSize,
    );

    this.logger.debug(`Found ${departments.length} departments`);

    return departments;
  }

  /**
   * Gets a department by its ID (admin panel)
   *
   * @throws {NotFoundException} If department is not found
   */
  async getDepartmentById({
    id,
    language,
  }: BaseParams & { id: number }): Promise<Department> {
    this.logger.debug(`Getting department by id: ${id}, language: ${language}`);

    const department = await this.departmentRepository.findById(id);

    if (!department) {
      throw new NotFoundException(
        this.i18nService.translate('errors.department_not_found_id', language, {
          id: String(id),
        }),
      );
    }

    return department;
  }

  /**
   * Gets a department by its slug (web browsing)
   *
   * @throws {NotFoundException} If department is not found
   *
   * @example
   * const dept = await getDepartmentBySlug({ slug: 'technology', language: Language.EN });
   */
  async getDepartmentBySlug({
    slug,
    language,
  }: BaseParams & { slug: string }): Promise<Department> {
    this.logger.debug(
      `Getting department by slug: ${slug}, language: ${language}`,
    );

    const department = await this.departmentRepository.findBySlug(
      slug,
      language,
    );

    if (!department) {
      throw new NotFoundException(
        this.i18nService.translate('errors.department_not_found', language, {
          slug,
        }),
      );
    }

    return department;
  }

  /**
   * Gets a department by ID together with the paginated list of every product
   * under it (admin panel). Subcategories are resolved through the Department
   * field resolvers.
   */
  async getDepartmentProductsById({
    id,
    language,
    page = 1,
    pageSize = 20,
    filter,
    sort,
    excludeSellerId,
  }: ProductQueryParams & { id: number }) {
    this.logger.debug(
      `Getting department products by id: ${id}, page=${page}, pageSize=${pageSize}`,
    );

    const department = await this.getDepartmentById({ id, language });

    return this.buildDepartmentProducts(department, {
      language,
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId,
    });
  }

  /**
   * Gets a department by slug together with the paginated list of every product
   * under it (web browsing). Subcategories are resolved through the Department
   * field resolvers.
   *
   * @example
   * const { department, products } = await getDepartmentProductsBySlug({
   *   slug: 'technology',
   *   language: Language.EN,
   *   page: 1,
   *   pageSize: 20,
   * });
   */
  async getDepartmentProductsBySlug({
    slug,
    language,
    page = 1,
    pageSize = 20,
    filter,
    sort,
    excludeSellerId,
  }: ProductQueryParams & { slug: string }) {
    this.logger.debug(
      `Getting department products by slug: ${slug}, page=${page}, pageSize=${pageSize}`,
    );

    const department = await this.getDepartmentBySlug({ slug, language });

    return this.buildDepartmentProducts(department, {
      language,
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId,
    });
  }

  /**
   * Fetches the paginated products of an already-resolved department and
   * returns the combined DepartmentProducts payload.
   */
  private async buildDepartmentProducts(
    department: Department,
    {
      language,
      page = 1,
      pageSize = 20,
      filter,
      sort,
      excludeSellerId,
    }: ProductQueryParams,
  ) {
    const currentPage = page ?? 1;
    const currentPageSize = pageSize ?? 20;

    this.validatePagination(currentPage, currentPageSize, language);

    const products = await this.productsService.getProductsByDepartment({
      departmentId: department.id,
      page: currentPage,
      pageSize: currentPageSize,
      filter,
      sort,
      excludeSellerId,
    });

    return {
      department,
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
