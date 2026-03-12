import { Injectable } from '@nestjs/common';
import { Language } from '../../graphql/enums';

type TranslationParams = Record<string, string>;

type TranslationMap = Record<string, Record<Language, string>>;

const TRANSLATIONS: TranslationMap = {
  'errors.category_not_found': {
    [Language.ES]: "Categoría con slug '{slug}' no encontrada",
    [Language.EN]: "Category with slug '{slug}' not found",
    [Language.FR]: "Catégorie avec le slug '{slug}' introuvable",
    [Language.PT]: "Categoria com slug '{slug}' não encontrada",
    [Language.DE]: "Kategorie mit Slug '{slug}' nicht gefunden",
  },
  'errors.invalid_pagination': {
    [Language.ES]: 'Parámetros de paginación inválidos',
    [Language.EN]: 'Invalid pagination parameters',
    [Language.FR]: 'Paramètres de pagination invalides',
    [Language.PT]: 'Parâmetros de paginação inválidos',
    [Language.DE]: 'Ungültige Paginierungsparameter',
  },
  'errors.department_not_found': {
    [Language.ES]: "Departamento con slug '{slug}' no encontrado",
    [Language.EN]: "Department with slug '{slug}' not found",
    [Language.FR]: "Département avec le slug '{slug}' introuvable",
    [Language.PT]: "Departamento com slug '{slug}' não encontrado",
    [Language.DE]: "Abteilung mit Slug '{slug}' nicht gefunden",
  },
  'errors.limit_out_of_range': {
    [Language.ES]: 'El límite debe estar entre {min} y {max}',
    [Language.EN]: 'Limit must be between {min} and {max}',
    [Language.FR]: 'La limite doit être comprise entre {min} et {max}',
    [Language.PT]: 'O limite deve estar entre {min} e {max}',
    [Language.DE]: 'Der Grenzwert muss zwischen {min} und {max} liegen',
  },
  'errors.offset_negative': {
    [Language.ES]: 'El offset no puede ser negativo',
    [Language.EN]: 'Offset must be non-negative',
    [Language.FR]: "L'offset ne peut pas être négatif",
    [Language.PT]: 'O offset não pode ser negativo',
    [Language.DE]: 'Der Offset darf nicht negativ sein',
  },
};

/**
 * I18N Service - Stateless language utilities for multi-language support
 *
 * This service provides only stateless utilities:
 * - Parsing the Accept-Language header (called once during context creation)
 * - Providing the default language constant
 * - Translating error/message keys for a given language
 *
 * Language for each request is stored in GraphQLContext.language (set at context
 * creation time from the Accept-Language header) and passed explicitly to services.
 * This service intentionally has NO mutable per-request state to avoid race conditions
 * in concurrent requests.
 */
@Injectable()
export class I18nService {
  readonly DEFAULT_LANGUAGE = Language.ES;

  /**
   * Parses the Accept-Language header and returns the best matching Language enum value.
   * Falls back to DEFAULT_LANGUAGE if no supported language is found.
   *
   * Called once per request in the GraphQL context factory.
   *
   * @param {string | undefined} acceptLanguageHeader - The Accept-Language header value
   * @returns {Language} The matched language or default
   *
   * @example
   * parseAcceptLanguage('en-US,en;q=0.9,es;q=0.8') // returns Language.EN
   * parseAcceptLanguage('fr-FR')                     // returns Language.FR
   * parseAcceptLanguage('xx-XX')                     // returns Language.ES (default)
   */
  parseAcceptLanguage(acceptLanguageHeader: string | undefined): Language {
    if (!acceptLanguageHeader) {
      return this.DEFAULT_LANGUAGE;
    }

    // Format: "en-US,en;q=0.9,es;q=0.8,fr;q=0.7"
    const languages = acceptLanguageHeader
      .split(',')
      .map((lang) => {
        const [code, qStr] = lang.trim().split(';');
        const q = qStr ? parseFloat(qStr.split('=')[1]) : 1.0;
        return { code: code.split('-')[0].toUpperCase(), q };
      })
      .sort((a, b) => b.q - a.q);

    for (const { code } of languages) {
      if (Object.values(Language).includes(code as Language)) {
        return code as Language;
      }
    }

    return this.DEFAULT_LANGUAGE;
  }

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
   * @param {string} key - Dot-separated translation key (e.g. 'errors.category_not_found')
   * @param {Language} language - The target language
   * @param {TranslationParams} params - Optional key/value pairs to interpolate into the message
   * @returns {string} The translated string with params substituted
   *
   * @example
   * translate('errors.category_not_found', Language.EN, { slug: 'audio' })
   * // → "Category with slug 'audio' not found"
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
