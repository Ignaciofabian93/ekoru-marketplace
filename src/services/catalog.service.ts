import { Injectable, Logger } from '@nestjs/common';
import { Language } from '../graphql/enums';
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
    const lang = language ?? this.i18nService.getDefaultLanguage();

    this.logger.debug(`Fetching marketplace catalog for language: ${lang}`);

    return this.catalogRepository.getMarketplaceCatalog(lang);
  }
}
