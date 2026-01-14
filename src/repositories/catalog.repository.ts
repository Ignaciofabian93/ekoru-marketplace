import { Logger, Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import type { DepartmentTranslation } from '../types/department';

@Injectable()
export class CatalogRepository {
  private readonly logger = new Logger(CatalogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a DataLoader for department translations with composite key (id + language)
   *
   * @returns {DataLoader<string, DepartmentTranslation | null>} DataLoader instance
   *
   * @example
   * const loader = createTranslationLoader();
   * const translation = await loader.load('1:ES');
   */
  createTranslationLoader(): DataLoader<string, DepartmentTranslation | null> {
    return new DataLoader<string, DepartmentTranslation | null>(
      async (compositeKeys: readonly string[]) => {
        try {
          const keyPairs = compositeKeys.map((key) => {
            const [idStr, language] = key.split(':');
            return {
              departmentId: parseInt(idStr, 10),
              language: language as Language,
            };
          });

          const translation = await this.prisma.departmentTranslation.findMany({
            where: {
              OR: keyPairs.map(({ departmentId, language }) => ({
                departmentId,
                language,
              })),
            },
          });

          const translationMap = new Map<string, DepartmentTranslation>();
          translation.forEach((translation) => {
            const key = `${translation.departmentId}:${translation.language}`;
            translationMap.set(key, translation);
          });
          return compositeKeys.map((key) => translationMap.get(key) || null);
        } catch (error) {
          this.logger.error(
            `Error loading department translations: ${error.message}`,
            error.stack,
          );
          throw error;
        }
      },
      {
        cacheKeyFn: (key: string) => key,
      },
    );
  }

  /**
   * Gets the complete marketplace catalog with translations
   * Returns departments with their categories and product categories
   * All filtered by the specified language
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
              productCategory: {
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
                },
              },
            },
          },
        },
      });

      // Transform to a cleaner structure for the menu
      return departments.map((dept) => ({
        id: dept.id,
        name: dept.translations[0]?.name || '',
        slug: dept.translations[0]?.slug || '',
        href: dept.translations[0]?.href || '',
        categories: dept.departmentCategory.map((cat) => ({
          id: cat.id,
          name: cat.translations[0]?.name || '',
          slug: cat.translations[0]?.slug || '',
          href: cat.translations[0]?.href || '',
          productCategories: cat.productCategory.map((prodCat) => ({
            id: prodCat.id,
            name: prodCat.translations[0]?.name || '',
            slug: prodCat.translations[0]?.slug || '',
            href: prodCat.translations[0]?.href || '',
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
