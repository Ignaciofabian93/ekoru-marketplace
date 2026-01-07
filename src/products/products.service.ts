import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
  UnAuthorizedError,
} from '../common/exceptions/graphql.exceptions';
import {
  calculatePrismaParams,
  createPaginatedResponse,
} from '../common/utils/pagination';
import {
  AddProductInput,
  UpdateProductInput,
  ProductFilterInput,
  ProductSortInput,
} from './dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  private readonly productInclude = {
    productCategory: {
      include: {
        materials: true,
        departmentCategory: {
          include: {
            department: true,
          },
        },
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  private buildProductWhereClause(filter?: ProductFilterInput) {
    const where: any = { deletedAt: null };

    if (!filter) return where;

    if (filter.name) {
      where.name = {
        contains: filter.name,
        mode: 'insensitive',
      };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) where.price.gte = filter.minPrice;
      if (filter.maxPrice !== undefined) where.price.lte = filter.maxPrice;
    }

    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.isExchangeable !== undefined)
      where.isExchangeable = filter.isExchangeable;

    if (filter.sellerId) where.sellerId = filter.sellerId;
    if (filter.productCategoryId)
      where.productCategoryId = filter.productCategoryId;

    if (filter.departmentCategoryId) {
      where.productCategory = {
        departmentCategoryId: filter.departmentCategoryId,
      };
    }
    if (filter.departmentId) {
      where.productCategory = {
        departmentCategory: {
          departmentId: filter.departmentId,
        },
      };
    }

    if (filter.condition) where.condition = filter.condition;

    if (filter.brand) {
      where.brand = {
        contains: filter.brand,
        mode: 'insensitive',
      };
    }
    if (filter.color) {
      where.color = {
        contains: filter.color,
        mode: 'insensitive',
      };
    }

    if (filter.badges && filter.badges.length > 0) {
      where.badges = {
        hasSome: filter.badges,
      };
    }
    if (filter.interests && filter.interests.length > 0) {
      where.interests = {
        hasSome: filter.interests,
      };
    }

    return where;
  }

  private buildProductOrderByClause(sort?: ProductSortInput): any {
    if (!sort || !sort.field) return { createdAt: 'desc' };

    const fieldMap: Record<string, string> = {
      CREATED_AT: 'createdAt',
      PRICE: 'price',
      NAME: 'name',
    };

    const field = fieldMap[sort.field] || 'createdAt';
    const order = sort.order?.toString() === 'ASC' ? 'asc' : 'desc';

    return { [field]: order };
  }

  async getProducts(
    page: number = 1,
    pageSize: number = 20,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    try {
      const { skip, take } = calculatePrismaParams(page, pageSize);
      const where = this.buildProductWhereClause(filter);
      const orderBy = this.buildProductOrderByClause(sort);

      const totalCount = await this.prisma.product.count({ where });

      const products = await this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: this.productInclude,
      });

      return createPaginatedResponse(products, page, pageSize, totalCount);
    } catch (error) {
      this.logger.error('[getProducts] Error:', error);
      throw new InternalServerError('Error al obtener los productos');
    }
  }

  async getProductById(id: number) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: Number(id) },
        include: this.productInclude,
      });

      if (!product) {
        throw new NotFoundError('Producto no encontrado');
      }

      return product;
    } catch (error) {
      this.logger.error('Error al obtener el producto:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Error al obtener el producto');
    }
  }

  async getProductsBySeller(
    sellerId: string,
    page: number = 1,
    pageSize: number = 20,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    try {
      const { skip, take } = calculatePrismaParams(page, pageSize);
      const where = this.buildProductWhereClause(filter);
      const orderBy = this.buildProductOrderByClause(sort);

      where.sellerId = sellerId;

      const totalCount = await this.prisma.product.count({ where });

      const products = await this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: this.productInclude,
      });

      return createPaginatedResponse(products, page, pageSize, totalCount);
    } catch (error) {
      this.logger.error(
        'Error al obtener los productos del propietario:',
        error,
      );
      throw new InternalServerError(
        'Error al obtener los productos del propietario',
      );
    }
  }

  async getProductsByCategory(
    productCategoryId: number,
    page: number = 1,
    pageSize: number = 20,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    try {
      const { skip, take } = calculatePrismaParams(page, pageSize);
      const where = this.buildProductWhereClause(filter);
      const orderBy = this.buildProductOrderByClause(sort);

      where.productCategoryId = productCategoryId;

      const totalCount = await this.prisma.product.count({ where });

      const products = await this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: this.productInclude,
      });

      return createPaginatedResponse(products, page, pageSize, totalCount);
    } catch (error) {
      this.logger.error('Error al obtener los productos por categoría:', error);
      throw new InternalServerError(
        'Error al obtener los productos por categoría',
      );
    }
  }

  async getExchangeableProducts(
    page: number = 1,
    pageSize: number = 20,
    filter?: ProductFilterInput,
    sort?: ProductSortInput,
  ) {
    try {
      const { skip, take } = calculatePrismaParams(page, pageSize);
      const where = this.buildProductWhereClause(filter);
      const orderBy = this.buildProductOrderByClause(sort);

      where.isExchangeable = true;
      where.isActive = true;

      const totalCount = await this.prisma.product.count({ where });

      const products = await this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: this.productInclude,
      });

      return createPaginatedResponse(products, page, pageSize, totalCount);
    } catch (error) {
      this.logger.error(
        'Error al obtener los productos intercambiables:',
        error,
      );
      throw new InternalServerError(
        'Error al obtener los productos intercambiables',
      );
    }
  }

  async addProduct(input: AddProductInput, sellerId?: string) {
    try {
      if (!sellerId) {
        throw new UnAuthorizedError('No autorizado');
      }

      const { productCategoryId } = input;
      const parsedProductCategoryId = Number(productCategoryId);

      const product = await this.prisma.product.create({
        data: {
          ...input,
          sellerId,
          productCategoryId: parsedProductCategoryId,
          updatedAt: new Date(),
        },
      });

      if (!product) {
        throw new InternalServerError('Error al crear el producto');
      }

      return product;
    } catch (error) {
      this.logger.error('Error al crear el producto:', error);
      if (error instanceof UnAuthorizedError) {
        throw error;
      }
      throw new InternalServerError('Error al crear el producto');
    }
  }

  async updateProduct(input: UpdateProductInput, sellerId?: string) {
    try {
      if (!sellerId) {
        throw new UnAuthorizedError('No autorizado');
      }

      const { id, ...data } = input;
      const parsedId = Number(id);

      const existingProduct = await this.prisma.product.findUnique({
        where: { id: parsedId },
        select: { sellerId: true },
      });

      if (!existingProduct) {
        throw new NotFoundError('Producto no encontrado');
      }

      if (existingProduct.sellerId !== sellerId) {
        throw new UnAuthorizedError(
          'No tienes permiso para editar este producto',
        );
      }

      const product = await this.prisma.product.update({
        where: { id: parsedId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return product;
    } catch (error) {
      this.logger.error('Error al actualizar el producto:', error);
      if (
        error instanceof UnAuthorizedError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      throw new InternalServerError('Error al actualizar el producto');
    }
  }

  async deleteProduct(id: number) {
    try {
      const product = await this.prisma.product.update({
        where: { id: Number(id) },
        data: {
          deletedAt: new Date(),
        },
      });

      if (!product) {
        throw new InternalServerError('Error al eliminar el producto');
      }

      return product;
    } catch (error) {
      this.logger.error('Error al eliminar el producto:', error);
      throw new InternalServerError('Error al eliminar el producto');
    }
  }

  async toggleProductActive(id: number, sellerId?: string) {
    try {
      if (!sellerId) {
        throw new UnAuthorizedError('No autorizado');
      }

      const existingProduct = await this.prisma.product.findUnique({
        where: { id: Number(id) },
        select: { sellerId: true, isActive: true },
      });

      if (!existingProduct) {
        throw new NotFoundError('Producto no encontrado');
      }

      if (existingProduct.sellerId !== sellerId) {
        throw new UnAuthorizedError(
          'No tienes permiso para modificar este producto',
        );
      }

      const product = await this.prisma.product.update({
        where: { id: Number(id) },
        data: {
          isActive: !existingProduct.isActive,
          updatedAt: new Date(),
        },
      });

      return product;
    } catch (error) {
      this.logger.error('Error al cambiar estado del producto:', error);
      if (
        error instanceof UnAuthorizedError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      throw new InternalServerError('Error al cambiar estado del producto');
    }
  }
}
