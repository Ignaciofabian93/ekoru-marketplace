import { Injectable } from '@nestjs/common';
import { Language } from '../../graphql/enums';

type TranslationParams = Record<string, string>;

type TranslationMap = Record<string, Record<Language, string>>;

const TRANSLATIONS: TranslationMap = {
  'errors.product_category_not_found': {
    [Language.ES]: "Categoría de producto con slug '{slug}' no encontrada",
    [Language.EN]: "Product category with slug '{slug}' not found",
    [Language.FR]: "Catégorie de produit avec le slug '{slug}' introuvable",
    [Language.PT]: "Categoria de produto com slug '{slug}' não encontrada",
    [Language.DE]: "Produktkategorie mit Slug '{slug}' nicht gefunden",
  },
  'errors.product_category_not_found_id': {
    [Language.ES]: "Categoría de producto con id '{id}' no encontrada",
    [Language.EN]: "Product category with id '{id}' not found",
    [Language.FR]: "Catégorie de produit avec l'id '{id}' introuvable",
    [Language.PT]: "Categoria de produto com id '{id}' não encontrada",
    [Language.DE]: "Produktkategorie mit ID '{id}' nicht gefunden",
  },
  'errors.invalid_pagination': {
    [Language.ES]: 'Parámetros de paginación inválidos',
    [Language.EN]: 'Invalid pagination parameters',
    [Language.FR]: 'Paramètres de pagination invalides',
    [Language.PT]: 'Parâmetros de paginação inválidos',
    [Language.DE]: 'Ungültige Paginierungsparameter',
  },
  'errors.invalid_page': {
    [Language.ES]: 'La página debe ser mayor o igual a 1',
    [Language.EN]: 'Page must be greater than or equal to 1',
    [Language.FR]: 'La page doit être supérieure ou égale à 1',
    [Language.PT]: 'A página deve ser maior ou igual a 1',
    [Language.DE]: 'Die Seite muss größer oder gleich 1 sein',
  },
  'errors.page_size_out_of_range': {
    [Language.ES]: 'El tamaño de página debe estar entre {min} y {max}',
    [Language.EN]: 'Page size must be between {min} and {max}',
    [Language.FR]: 'La taille de page doit être comprise entre {min} et {max}',
    [Language.PT]: 'O tamanho da página deve estar entre {min} e {max}',
    [Language.DE]: 'Die Seitengröße muss zwischen {min} und {max} liegen',
  },
};

/**
 * I18N Service - Stateless language utilities for the productCategories subdomain
 *
 * Language for each request is stored in GraphQLContext.language (set at context
 * creation time from the Accept-Language header) and passed explicitly to services.
 * This service intentionally has NO mutable per-request state to avoid race conditions
 * in concurrent requests.
 */
@Injectable()
export class I18nProductCategoryService {
  readonly DEFAULT_LANGUAGE = Language.ES;

  /**
   * Returns the default language used as fallback.
   */
  getDefaultLanguage(): Language {
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Translates a message key into the requested language, with optional interpolation.
   * Falls back to DEFAULT_LANGUAGE if the key is not found for the requested language.
   *
   * @example
   * translate('errors.product_category_not_found', Language.EN, { slug: 'led-grande' })
   * // → "Product category with slug 'led-grande' not found"
   */
  translate(
    key: string,
    language: Language,
    params?: TranslationParams,
  ): string {
    const entry = TRANSLATIONS[key];
    let message = entry?.[language] ?? entry?.[this.DEFAULT_LANGUAGE] ?? key;

    if (params) {
      for (const [param, value] of Object.entries(params)) {
        message = message.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
      }
    }

    return message;
  }
}
