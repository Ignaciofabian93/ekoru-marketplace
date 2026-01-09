import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';

/**
 * I18N Service - Manages language context for multi-language support
 *
 * This service provides language context management for the application.
 * In a request-scoped architecture, language is extracted from headers
 * and made available throughout the request lifecycle.
 */
@Injectable()
export class I18nService {
  private readonly DEFAULT_LANGUAGE = Language.ES;
  private currentLanguage: Language = this.DEFAULT_LANGUAGE;

  /**
   * Gets the current language for the request context
   * @returns {Language} The current language enum value
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Sets the current language for the request context
   * @param {Language} language - The language to set
   */
  setCurrentLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  /**
   * Parses Accept-Language header and returns the best matching Language
   * Falls back to DEFAULT_LANGUAGE if no match is found
   *
   * @param {string | undefined} acceptLanguageHeader - The Accept-Language header value
   * @returns {Language} The matched language or default
   *
   * @example
   * parseAcceptLanguage('en-US,en;q=0.9,es;q=0.8') // returns Language.EN
   * parseAcceptLanguage('fr-FR') // returns Language.FR
   * parseAcceptLanguage('xx-XX') // returns Language.ES (default)
   */
  parseAcceptLanguage(acceptLanguageHeader: string | undefined): Language {
    if (!acceptLanguageHeader) {
      return this.DEFAULT_LANGUAGE;
    }

    // Parse the Accept-Language header
    // Format: "en-US,en;q=0.9,es;q=0.8,fr;q=0.7"
    const languages = acceptLanguageHeader
      .split(',')
      .map((lang) => {
        const [code, qStr] = lang.trim().split(';');
        const q = qStr ? parseFloat(qStr.split('=')[1]) : 1.0;
        return { code: code.split('-')[0].toUpperCase(), q };
      })
      .sort((a, b) => b.q - a.q);

    // Find the first matching language
    for (const { code } of languages) {
      if (Object.values(Language).includes(code as Language)) {
        return code as Language;
      }
    }

    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Gets the default language for fallback scenarios
   * @returns {Language} The default language
   */
  getDefaultLanguage(): Language {
    return this.DEFAULT_LANGUAGE;
  }
}
