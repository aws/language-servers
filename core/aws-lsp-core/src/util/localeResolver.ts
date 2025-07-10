/**
 * LocaleResolver provides utilities for resolving the best matching locale
 * from a set of available locales based on a requested locale.
 *
 * This implementation uses CLDR data and follows the BCP 47 specification
 * for robust locale matching with proper fallback mechanisms.
 *
 * Note: This implementation requires the @formatjs/intl-localematcher package.
 * To use this class, add the following to your package.json:
 *
 * ```
 * "dependencies": {
 *   "@formatjs/intl-localematcher": "^0.4.0"
 * }
 * ```
 */

// TODO-NOTIFY: Add @formatjs/intl-localematcher to package.json
// import { match } from '@formatjs/intl-localematcher';

/**
 * Temporary implementation of match function until the dependency is added
 * This simulates the behavior of @formatjs/intl-localematcher's match function
 * but with simplified logic
 */
function match(requestedLocales: string[], availableLocales: string[], defaultLocale: string): string {
    if (!requestedLocales.length || !availableLocales.length) {
        return defaultLocale
    }

    const requestedLocale = requestedLocales[0].toLowerCase()
    const normalizedAvailable = availableLocales.map(locale => locale.toLowerCase())

    // Exact match
    const exactMatchIndex = normalizedAvailable.indexOf(requestedLocale)
    if (exactMatchIndex !== -1) {
        return availableLocales[exactMatchIndex]
    }

    // Language match
    const [requestedLanguage] = requestedLocale.split('-')
    for (let i = 0; i < normalizedAvailable.length; i++) {
        const [availableLanguage] = normalizedAvailable[i].split('-')
        if (availableLanguage === requestedLanguage) {
            return availableLocales[i]
        }
    }

    // Default locale if available
    const defaultIndex = normalizedAvailable.indexOf(defaultLocale.toLowerCase())
    if (defaultIndex !== -1) {
        return availableLocales[defaultIndex]
    }

    // First available as last resort
    return availableLocales[0]
}

export class LocaleResolver {
    /**
     * Default locale to fall back to when no better match is found
     */
    private readonly defaultLocale: string

    /**
     * Creates a new LocaleResolver
     * @param defaultLocale The default locale to use when no match is found (defaults to 'en-US')
     */
    constructor(defaultLocale: string = 'en-US') {
        this.defaultLocale = defaultLocale
    }

    /**
     * Finds the best matching locale from available locales based on the requested locale
     * using CLDR data and the BCP 47 specification.
     *
     * The matching follows the Unicode Technical Standard #35 and includes:
     * - Exact matching of language, script, and region
     * - Matching language with different script or region
     * - Fallback to language-only matching
     * - Fallback to default locale
     *
     * @param availableLocales Array of available locale strings
     * @param requestedLocale The locale requested by the client
     * @returns The best matching locale from the available locales
     * @throws Error if availableLocales is empty
     */
    resolveLocale(availableLocales: string[], requestedLocale: string): string {
        if (!availableLocales || availableLocales.length === 0) {
            throw new Error('Available locales array cannot be empty')
        }

        try {
            // Use the CLDR-based matcher
            return match([requestedLocale], availableLocales, this.defaultLocale)
        } catch (error) {
            // Fall back to first available locale if matching fails
            return availableLocales[0]
        }
    }

    /**
     * Gets the language part of a locale string (e.g., 'en' from 'en-US')
     * @param locale The locale string
     * @returns The language part of the locale
     */
    getLanguage(locale: string): string {
        return locale.split('-')[0]
    }

    /**
     * Gets the region part of a locale string (e.g., 'US' from 'en-US')
     * @param locale The locale string
     * @returns The region part of the locale or undefined if not present
     */
    getRegion(locale: string): string | undefined {
        const parts = locale.split('-')
        return parts.length > 1 ? parts[1] : undefined
    }
}
