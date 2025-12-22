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

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDepartments(sellerId?: string) {
    try {
      if (!sellerId) {
        throw new UnAuthorizedError('No autorizado.');
      }

      const departments = await this.prisma.department.findMany({
        orderBy: {
          departmentName: 'asc',
        },
      });

      if (!departments) {
        throw new NotFoundError('No se encontraron departamentos.');
      }

      return departments;
    } catch (error) {
      this.logger.error('Error al obtener los departamentos:', error);
      if (
        error instanceof NotFoundError ||
        error instanceof UnAuthorizedError
      ) {
        throw error;
      }
      throw new InternalServerError('Error al obtener los departamentos.');
    }
  }

  async getDepartmentCategoriesByDepartmentId(
    departmentId: number,
    sellerId?: string,
  ) {
    try {
      if (!sellerId) {
        throw new UnAuthorizedError('No autorizado.');
      }

      const parsedId = Number(departmentId);
      const departmentCategories =
        await this.prisma.departmentCategory.findMany({
          where: {
            departmentId: parsedId,
          },
          orderBy: {
            departmentCategoryName: 'asc',
          },
        });

      if (!departmentCategories) {
        throw new NotFoundError(
          'No se encontraron categorías de departamento.',
        );
      }

      return departmentCategories;
    } catch (error) {
      this.logger.error(
        'Error al obtener las categorías de departamento:',
        error,
      );
      if (
        error instanceof NotFoundError ||
        error instanceof UnAuthorizedError
      ) {
        throw error;
      }
      throw new InternalServerError(
        'Error al obtener las categorías de departamento.',
      );
    }
  }

  async getProductCategoriesByDepartmentCategoryId(
    departmentCategoryId: number,
    sellerId?: string,
  ) {
    try {
      if (!sellerId) {
        throw new UnAuthorizedError('No autorizado.');
      }

      const parsedId = Number(departmentCategoryId);
      const productCategories = await this.prisma.productCategory.findMany({
        where: {
          departmentCategoryId: parsedId,
        },
        include: {
          materials: {
            include: {
              material: true,
            },
          },
        },
        orderBy: {
          productCategoryName: 'asc',
        },
      });

      if (!productCategories) {
        throw new NotFoundError('No se encontraron categorías de productos.');
      }

      return productCategories;
    } catch (error) {
      this.logger.error('Error al obtener las categorías de productos:', error);
      if (
        error instanceof NotFoundError ||
        error instanceof UnAuthorizedError
      ) {
        throw error;
      }
      throw new InternalServerError(
        'Error al obtener las categorías de productos.',
      );
    }
  }

  async getDepartment(id: number, page: number = 1, pageSize: number = 20) {
    try {
      const parsedId = Number(id);
      const { skip, take } = calculatePrismaParams(page, pageSize);

      const department = await this.prisma.department.findUnique({
        where: { id: parsedId },
        select: {
          id: true,
          departmentName: true,
          departmentImage: true,
          href: true,
          departmentCategory: {
            select: {
              id: true,
              departmentCategoryName: true,
              departmentId: true,
              href: true,
              productCategory: {
                select: {
                  id: true,
                  productCategoryName: true,
                  departmentCategoryId: true,
                  keywords: true,
                  size: true,
                  averageWeight: true,
                  weightUnit: true,
                  href: true,
                  _count: {
                    select: {
                      product: true,
                    },
                  },
                },
                orderBy: {
                  productCategoryName: 'asc',
                },
              },
            },
            orderBy: {
              departmentCategoryName: 'asc',
            },
          },
        },
      });

      if (!department) {
        throw new NotFoundError('Departamento no encontrado.');
      }

      const totalProductsCount = await this.prisma.product.count({
        where: {
          productCategory: {
            departmentCategory: {
              departmentId: parsedId,
            },
          },
          isActive: true,
          deletedAt: null,
        },
      });

      const products = await this.prisma.product.findMany({
        where: {
          productCategory: {
            departmentCategory: {
              departmentId: parsedId,
            },
          },
          isActive: true,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      return {
        ...department,
        products: createPaginatedResponse(
          products,
          page,
          pageSize,
          totalProductsCount,
        ),
      };
    } catch (error) {
      this.logger.error('Error al obtener el departamento:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Error al obtener el departamento.');
    }
  }

  async getDepartmentCategories(
    departmentId: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    try {
      const parsedId = Number(departmentId);
      const { skip, take } = calculatePrismaParams(page, pageSize);

      const totalCount = await this.prisma.departmentCategory.count({
        where: { departmentId: parsedId },
      });

      const departmentCategories =
        await this.prisma.departmentCategory.findMany({
          where: { departmentId: parsedId },
          select: {
            id: true,
            departmentCategoryName: true,
            departmentId: true,
            href: true,
            productCategory: {
              select: {
                id: true,
                productCategoryName: true,
                departmentCategoryId: true,
                keywords: true,
                size: true,
                averageWeight: true,
                weightUnit: true,
                href: true,
                _count: {
                  select: {
                    product: true,
                  },
                },
              },
              orderBy: {
                productCategoryName: 'asc',
              },
            },
          },
          orderBy: {
            departmentCategoryName: 'asc',
          },
          skip,
          take,
        });

      return createPaginatedResponse(
        departmentCategories,
        page,
        pageSize,
        totalCount,
      );
    } catch (error) {
      this.logger.error(
        'Error al obtener las categorías de departamento:',
        error,
      );
      throw new InternalServerError(
        'Error al obtener las categorías de departamento.',
      );
    }
  }

  async getDepartmentCategory(
    id: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    try {
      const parsedId = Number(id);
      const { skip, take } = calculatePrismaParams(page, pageSize);

      const departmentCategory =
        await this.prisma.departmentCategory.findUnique({
          where: { id: parsedId },
          select: {
            id: true,
            departmentCategoryName: true,
            departmentId: true,
            href: true,
            department: {
              select: {
                id: true,
                departmentName: true,
                departmentImage: true,
                href: true,
              },
            },
            productCategory: {
              select: {
                id: true,
                productCategoryName: true,
                departmentCategoryId: true,
                keywords: true,
                size: true,
                averageWeight: true,
                weightUnit: true,
                href: true,
                materials: {
                  include: {
                    material: true,
                  },
                },
                _count: {
                  select: {
                    product: true,
                  },
                },
              },
              orderBy: {
                productCategoryName: 'asc',
              },
            },
          },
        });

      if (!departmentCategory) {
        throw new NotFoundError('Categoría de departamento no encontrada.');
      }

      const totalProductsCount = await this.prisma.product.count({
        where: {
          productCategory: {
            departmentCategoryId: parsedId,
          },
          isActive: true,
          deletedAt: null,
        },
      });

      const products = await this.prisma.product.findMany({
        where: {
          productCategory: {
            departmentCategoryId: parsedId,
          },
          isActive: true,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      return {
        ...departmentCategory,
        products: createPaginatedResponse(
          products,
          page,
          pageSize,
          totalProductsCount,
        ),
      };
    } catch (error) {
      this.logger.error(
        'Error al obtener la categoría de departamento:',
        error,
      );
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'Error al obtener la categoría de departamento.',
      );
    }
  }

  async getProductCategories(
    departmentCategoryId: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    try {
      const parsedId = Number(departmentCategoryId);
      const { skip, take } = calculatePrismaParams(page, pageSize);

      const totalCount = await this.prisma.productCategory.count({
        where: { departmentCategoryId: parsedId },
      });

      const productCategories = await this.prisma.productCategory.findMany({
        where: { departmentCategoryId: parsedId },
        select: {
          id: true,
          productCategoryName: true,
          departmentCategoryId: true,
          keywords: true,
          size: true,
          averageWeight: true,
          weightUnit: true,
          href: true,
          materials: {
            select: {
              id: true,
              productCategoryId: true,
              materialTypeId: true,
              quantity: true,
              unit: true,
              isPrimary: true,
              createdAt: true,
              updatedAt: true,
              material: {
                select: {
                  id: true,
                  materialType: true,
                  estimatedCo2SavingsKG: true,
                  estimatedWaterSavingsLT: true,
                },
              },
            },
            orderBy: [{ isPrimary: 'desc' }, { quantity: 'desc' }],
          },
          _count: {
            select: {
              product: true,
            },
          },
        },
        orderBy: {
          productCategoryName: 'asc',
        },
        skip,
        take,
      });

      return createPaginatedResponse(
        productCategories,
        page,
        pageSize,
        totalCount,
      );
    } catch (error) {
      this.logger.error('Error al obtener las categorías de producto:', error);
      throw new InternalServerError(
        'Error al obtener las categorías de producto.',
      );
    }
  }

  async getProductCategory(
    id: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    try {
      const parsedId = Number(id);
      const { skip, take } = calculatePrismaParams(page, pageSize);

      const productCategory = await this.prisma.productCategory.findUnique({
        where: { id: parsedId },
        select: {
          id: true,
          productCategoryName: true,
          departmentCategoryId: true,
          keywords: true,
          size: true,
          averageWeight: true,
          weightUnit: true,
          href: true,
          departmentCategory: {
            select: {
              id: true,
              departmentCategoryName: true,
              departmentId: true,
              href: true,
              department: {
                select: {
                  id: true,
                  departmentName: true,
                  departmentImage: true,
                  href: true,
                },
              },
            },
          },
          materials: {
            select: {
              id: true,
              productCategoryId: true,
              materialTypeId: true,
              quantity: true,
              unit: true,
              isPrimary: true,
              createdAt: true,
              updatedAt: true,
              material: {
                select: {
                  id: true,
                  materialType: true,
                  estimatedCo2SavingsKG: true,
                  estimatedWaterSavingsLT: true,
                },
              },
            },
            orderBy: [{ isPrimary: 'desc' }, { quantity: 'desc' }],
          },
        },
      });

      if (!productCategory) {
        throw new NotFoundError('Categoría de producto no encontrada.');
      }

      const totalProductsCount = await this.prisma.product.count({
        where: {
          productCategoryId: parsedId,
          isActive: true,
          deletedAt: null,
        },
      });

      const products = await this.prisma.product.findMany({
        where: {
          productCategoryId: parsedId,
          isActive: true,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      return {
        ...productCategory,
        products: createPaginatedResponse(
          products,
          page,
          pageSize,
          totalProductsCount,
        ),
      };
    } catch (error) {
      this.logger.error('Error al obtener la categoría de producto:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError(
        'Error al obtener la categoría de producto.',
      );
    }
  }
}
