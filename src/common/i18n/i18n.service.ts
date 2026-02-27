import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';

/**
 * I18N Service - Stateless language utilities for multi-language support
 *
 * This service provides only stateless utilities:
 * - Parsing the Accept-Language header (called once during context creation)
 * - Providing the default language constant
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
}
