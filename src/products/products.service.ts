import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ProductFilterInput,
  ProductSortInput,
  AddProductInput,
  UpdateProductInput,
} from './dto/product.input';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a single product by ID
   */
  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        productCategory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Get all products with pagination and filters
   */
  async getProducts(
    page: number,
    pageSize: number,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhereClause(filter);
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          productCategory: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get products by seller ID
   */
  async getProductsBySeller(
    sellerId: string,
    page: number,
    pageSize: number,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter),
      sellerId,
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          productCategory: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get products by Product Category ID
   * Returns only products in this specific category (e.g., only speakers)
   */
  async getProductsByCategory(
    productCategoryId: number,
    page: number,
    pageSize: number,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter),
      productCategoryId,
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          productCategory: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get products by Department Category ID
   * Returns all products from all product categories under this department category
   * Example: "Audio" → speakers, microphones, cables, etc.
   */
  async getProductsByDepartmentCategory(
    departmentCategoryId: number,
    page: number,
    pageSize: number,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    // First, get all product category IDs under this department category
    const productCategories = await this.prisma.productCategory.findMany({
      where: {
        departmentCategoryId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const productCategoryIds = productCategories.map((pc) => pc.id);

    if (productCategoryIds.length === 0) {
      return this.createPaginatedResponse([], 0, page, pageSize);
    }

    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter),
      productCategoryId: {
        in: productCategoryIds,
      },
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          productCategory: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get products by Department ID
   * Returns all products from all categories under this department
   * Example: "Technology" → all products from audio, TV, home tech, etc.
   */
  async getProductsByDepartment(
    departmentId: number,
    page: number,
    pageSize: number,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    // First, get all department category IDs under this department
    const departmentCategories = await this.prisma.departmentCategory.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const departmentCategoryIds = departmentCategories.map((dc) => dc.id);

    if (departmentCategoryIds.length === 0) {
      return this.createPaginatedResponse([], 0, page, pageSize);
    }

    // Then, get all product category IDs under these department categories
    const productCategories = await this.prisma.productCategory.findMany({
      where: {
        departmentCategoryId: {
          in: departmentCategoryIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const productCategoryIds = productCategories.map((pc) => pc.id);

    if (productCategoryIds.length === 0) {
      return this.createPaginatedResponse([], 0, page, pageSize);
    }

    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter),
      productCategoryId: {
        in: productCategoryIds,
      },
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          productCategory: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Get exchangeable products
   */
  async getExchangeableProducts(
    page: number,
    pageSize: number,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter),
      isExchangeable: true,
    };
    const orderBy = this.buildOrderBy(sort);

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          productCategory: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Add a new product
   */
  async addProduct(input: AddProductInput, sellerId?: string) {
    if (!sellerId) {
      throw new UnauthorizedException('Seller authentication required');
    }

    const product = await this.prisma.product.create({
      data: {
        ...input,
        sellerId,
        updatedAt: new Date(),
      },
      include: {
        productCategory: true,
      },
    });

    return product;
  }

  /**
   * Update an existing product
   */
  async updateProduct(input: UpdateProductInput, sellerId?: string) {
    if (!sellerId) {
      throw new UnauthorizedException('Seller authentication required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: input.id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${input.id} not found`);
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    const { id, ...data } = input;
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        productCategory: true,
      },
    });

    return updatedProduct;
  }

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const deletedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      include: {
        productCategory: true,
      },
    });

    return deletedProduct;
  }

  /**
   * Toggle product active status
   */
  async toggleProductActive(id: number, sellerId?: string) {
    if (!sellerId) {
      throw new UnauthorizedException('Seller authentication required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You do not have permission to modify this product',
      );
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        isActive: !product.isActive,
        updatedAt: new Date(),
      },
      include: {
        productCategory: true,
      },
    });

    return updatedProduct;
  }

  /**
   * Build Prisma orderBy clause from sort input
   */
  private buildOrderBy(
    sort?: ProductSortInput,
  ): Prisma.ProductOrderByWithRelationInput {
    if (!sort || !sort.field) {
      return { createdAt: 'desc' };
    }

    const field = sort.field.toLowerCase();
    const order = sort.order?.toLowerCase() || 'desc';

    return { [field]: order } as Prisma.ProductOrderByWithRelationInput;
  }

  /**
   * Create paginated response
   */
  private createPaginatedResponse<T>(
    items: T[],
    totalCount: number,
    page: number,
    pageSize: number,
  ) {
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      edges: items,
      pageInfo: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
  /**
   * Build Prisma where clause from filter input
   */
  private buildWhereClause(filter?: ProductFilterInput) {
    if (!filter) {
      return {
        isActive: true,
        deletedAt: null,
      };
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (filter.name) {
      where.name = {
        contains: filter.name,
        mode: 'insensitive',
      };
    }

    if (filter.minPrice !== undefined) {
      where.price = { gte: filter.minPrice };
    }

    if (filter.maxPrice !== undefined) {
      where.price = { lte: filter.maxPrice };
    }

    if (filter.condition) {
      where.condition = filter.condition;
    }

    if (filter.isExchangeable !== undefined) {
      where.isExchangeable = filter.isExchangeable;
    }

    if (filter.badges && filter.badges.length > 0) {
      where.badges = {
        hasSome: filter.badges,
      };
    }

    return where;
  }
}
