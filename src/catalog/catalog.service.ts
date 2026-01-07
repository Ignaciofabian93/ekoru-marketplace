import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

@Injectable()
export class MarketplaceCatalogService {
  private readonly logger = new Logger(MarketplaceCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMarketplaceCatalog() {
    try {
      const departments = await this.prisma.department.findMany({
        select: {
          id: true,
          departmentName: true,
          href: true,
          departmentCategory: {
            select: {
              id: true,
              departmentId: true,
              departmentCategoryName: true,
              href: true,
              productCategory: {
                select: {
                  id: true,
                  productCategoryName: true,
                  departmentCategoryId: true,
                  href: true,
                },
              },
            },
          },
        },
        orderBy: {
          departmentName: 'asc',
        },
      });

      if (!departments.length) {
        throw new NotFoundError('No se encontraron departamentos');
      }

      return departments;
    } catch (error) {
      this.logger.error('Error al obtener el catálogo marketplace:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Error al obtener el catálogo marketplace');
    }
  }
}
