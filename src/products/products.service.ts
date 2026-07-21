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
        productCategory: {
          include: {
            productCategoryTranslation: true,
            departmentCategory: {
              include: {
                departmentCategoryTranslation: true,
                department: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
          },
        },
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
  async getProducts({
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    page: number;
    pageSize: number;
    filter?: ProductFilterInput;
    sort?: ProductSortInput;
    excludeSellerId?: string;
  }) {
    const skip = (page - 1) * pageSize;
    const where = this.buildWhereClause(filter, excludeSellerId);
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
  async getProductsBySeller({
    sellerId,
    page,
    pageSize,
    filter,
    sort,
  }: {
    sellerId: string;
    page: number;
    pageSize: number;
    filter?: ProductFilterInput;
    sort?: ProductSortInput;
  }) {
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
  async getProductsByCategory({
    productCategoryId,
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    productCategoryId: number;
    page: number;
    pageSize: number;
    filter?: ProductFilterInput;
    sort?: ProductSortInput;
    excludeSellerId?: string;
  }) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter, excludeSellerId),
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
  async getProductsByDepartmentCategory({
    departmentCategoryId,
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    departmentCategoryId: number;
    page: number;
    pageSize: number;
    filter?: ProductFilterInput;
    sort?: ProductSortInput;
    excludeSellerId?: string;
  }) {
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
      ...this.buildWhereClause(filter, excludeSellerId),
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
  async getProductsByDepartment({
    departmentId,
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    departmentId: number;
    page: number;
    pageSize: number;
    filter?: ProductFilterInput;
    sort?: ProductSortInput;
    excludeSellerId?: string;
  }) {
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
      ...this.buildWhereClause(filter, excludeSellerId),
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
  async getExchangeableProducts({
    page,
    pageSize,
    filter,
    sort,
    excludeSellerId,
  }: {
    page: number;
    pageSize: number;
    filter?: ProductFilterInput;
    sort?: ProductSortInput;
    excludeSellerId?: string;
  }) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...this.buildWhereClause(filter, excludeSellerId),
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
          productCategory: {
            include: {
              materials: {
                include: {
                  material: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Add a new product. Creation is seller-scoped: a product is always owned by
   * the calling seller.
   */
  async addProduct({
    input,
    sellerId,
  }: {
    input: AddProductInput;
    sellerId?: string;
  }) {
    if (!sellerId) {
      throw new UnauthorizedException('Seller authentication required');
    }

    const product = await this.prisma.product.create({
      data: {
        ...input,
        name: input.name,
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
   * Update an existing product. The owning seller or a platform admin may
   * update; admins bypass the ownership check.
   */
  async updateProduct({
    input,
    sellerId,
    adminId,
  }: {
    input: UpdateProductInput;
    sellerId?: string;
    adminId?: string;
  }) {
    if (!sellerId && !adminId) {
      throw new UnauthorizedException('Authentication required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: input.id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${input.id} not found`);
    }

    if (!adminId && product.sellerId !== sellerId) {
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
   * Delete a product (soft delete). The owning seller or a platform admin may
   * delete; admins bypass the ownership check.
   */
  async deleteProduct({
    id,
    sellerId,
    adminId,
  }: {
    id: number;
    sellerId?: string;
    adminId?: string;
  }) {
    if (!sellerId && !adminId) {
      throw new UnauthorizedException('Authentication required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (!adminId && product.sellerId !== sellerId) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
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
   * Toggle product active status. The owning seller or a platform admin may
   * toggle; admins bypass the ownership check.
   */
  async toggleProductActive({
    id,
    sellerId,
    adminId,
  }: {
    id: number;
    sellerId?: string;
    adminId?: string;
  }) {
    if (!sellerId && !adminId) {
      throw new UnauthorizedException('Authentication required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (!adminId && product.sellerId !== sellerId) {
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
   * Toggle the current seller's favorite mark on a product. Idempotent per
   * (product, seller): a second call removes the favorite. Returns the product
   * so the resolver can re-resolve `isLiked` for the caller. Favoriting requires
   * authentication.
   */
  async toggleProductLike({
    productId,
    sellerId,
  }: {
    productId: number;
    sellerId?: string;
  }) {
    if (!sellerId) {
      throw new UnauthorizedException('Authentication required');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { productCategory: true },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Toggle the like row and keep the denormalized `likesCount` counter in
    // sync. The count is recomputed from the like rows (not blindly ±1) so it
    // self-heals from any drift. Runs in a transaction so a row and its count
    // never diverge, and returns the updated product so the mutation's
    // `likesCount` is fresh (`isLiked` re-resolves per request via its loader).
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.marketplaceProductLike.findUnique({
        where: { productId_sellerId: { productId, sellerId } },
        select: { id: true },
      });

      if (existing) {
        await tx.marketplaceProductLike.delete({ where: { id: existing.id } });
      } else {
        await tx.marketplaceProductLike.create({
          data: { productId, sellerId },
        });
      }

      const likesCount = await tx.marketplaceProductLike.count({
        where: { productId },
      });

      return tx.product.update({
        where: { id: productId },
        data: { likesCount },
        include: { productCategory: true },
      });
    });
  }

  /**
   * Paginated list of the current seller's favorite products. Soft-deleted or
   * inactive products are excluded so "unavailable" favorites drop off
   * automatically. Most-recently favorited first.
   */
  async getMyFavorites({
    sellerId,
    page,
    pageSize,
  }: {
    sellerId?: string;
    page: number;
    pageSize: number;
  }) {
    if (!sellerId) {
      throw new UnauthorizedException('Authentication required');
    }

    const skip = (page - 1) * pageSize;
    const where = {
      sellerId,
      product: { isActive: true, deletedAt: null },
    };

    const [likes, totalCount] = await Promise.all([
      this.prisma.marketplaceProductLike.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { product: { include: { productCategory: true } } },
      }),
      this.prisma.marketplaceProductLike.count({ where }),
    ]);

    const products = likes.map((like) => like.product);
    return this.createPaginatedResponse(products, totalCount, page, pageSize);
  }

  /**
   * Allowed sort fields, keyed by their lowercase form so client casing
   * (createdAt, createdat, CREATED_AT stripped of underscores, etc.) cannot
   * produce a column Prisma does not know.
   */
  private static readonly SORTABLE_FIELDS: Record<
    string,
    keyof Prisma.ProductOrderByWithRelationInput
  > = {
    createdat: 'createdAt',
    price: 'price',
    name: 'name',
    condition: 'condition',
  };

  /**
   * Build Prisma orderBy clause from sort input
   */
  private buildOrderBy(
    sort?: ProductSortInput,
  ): Prisma.ProductOrderByWithRelationInput {
    const field = sort?.field
      ? ProductsService.SORTABLE_FIELDS[
          sort.field.replace(/_/g, '').toLowerCase()
        ]
      : undefined;

    if (!field) {
      return { createdAt: 'desc' };
    }

    const order = sort?.order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return { [field]: order };
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
      nodes: items,
      pageInfo: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        pageSize,
        startCursor: null,
        endCursor: null,
      },
    };
  }
  /**
   * Build Prisma where clause from filter input.
   *
   * When `excludeSellerId` is provided (the authenticated caller), that seller's
   * own products are hidden from browsing/search results — they remain visible
   * to the seller in their profile via getProductsBySeller.
   */
  private buildWhereClause(
    filter?: ProductFilterInput,
    excludeSellerId?: string,
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      deletedAt: null,
    };

    if (excludeSellerId) {
      where.sellerId = { not: excludeSellerId };
    }

    if (!filter) {
      return where;
    }

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
