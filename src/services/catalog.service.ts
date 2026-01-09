import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Language } from '@prisma/client';
import { I18nService } from '../common/i18n';
import { CatalogRepository } from '../repositories/catalog.repository';
import type { MarketplaceCatalog } from '../types/catalog';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly i18nService: I18nService,
  ) {}

  async getMarketplaceCatalog(
    language?: Language,
  ): Promise<MarketplaceCatalog> {
    const lang = language || this.i18nService.getCurrentLanguage();

    this.logger.debug(`Fetching marketplace catalog for language: ${lang}`);

    const catalog = await this.catalogRepository.getMarketplaceCatalog(lang);

    if (!catalog || catalog.length === 0) {
      throw new NotFoundException(
        `Marketplace catalog not found for language '${lang}'`,
      );
    }

    return catalog;
  }
}
