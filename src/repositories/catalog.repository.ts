import { Logger, Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogRepository {
  private readonly logger = new Logger(CatalogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gets the complete marketplace catalog with translations.
   * Returns departments with their categories and product categories,
   * all filtered by the specified language.
   */
  async getMarketplaceCatalog(language: Language) {
    try {
      const departments = await this.prisma.department.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
        include: {
          translations: {
            where: {
              language: language,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              href: true,
            },
          },
          departmentCategory: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
            include: {
              departmentCategoryTranslation: {
                where: {
                  language: language,
                },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  href: true,
                },
              },
              productCategory: {
                where: {
                  isActive: true,
                },
                orderBy: {
                  sortOrder: 'asc',
                },
                include: {
                  productCategoryTranslation: {
                    where: {
                      language: language,
                    },
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      href: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return departments.map((dept) => ({
        id: dept.id,
        name: dept.translations[0]?.name || '',
        slug: dept.translations[0]?.slug || '',
        href: dept.translations[0]?.href || '',
        categories: dept.departmentCategory.map((cat) => ({
          id: cat.id,
          name: cat.departmentCategoryTranslation[0]?.name || '',
          slug: cat.departmentCategoryTranslation[0]?.slug || '',
          href: cat.departmentCategoryTranslation[0]?.href || '',
          productCategories: cat.productCategory.map((prodCat) => ({
            id: prodCat.id,
            name: prodCat.productCategoryTranslation[0]?.name || '',
            slug: prodCat.productCategoryTranslation[0]?.slug || '',
            href: prodCat.productCategoryTranslation[0]?.href || '',
          })),
        })),
      }));
    } catch (error) {
      this.logger.error(
        `Error getting marketplace catalog: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
