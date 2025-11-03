/**
 * Text Measurer Utility
 *
 * Accurately measures text width accounting for:
 * - Full-width (CJK) characters
 * - Half-width characters
 * - ANSI color codes
 * - Control characters
 */

import { TextMeasurement } from '../types/progress-tracker.types';

/**
 * ANSI escape code regex pattern
 */
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

/**
 * Full-width character ranges (CJK and other wide characters)
 */
const FULLWIDTH_RANGES = [
  [0x1100, 0x115f], // Hangul Jamo
  [0x2329, 0x232a], // Angle brackets
  [0x2e80, 0x2e99], // CJK Radicals Supplement
  [0x2e9b, 0x2ef3],
  [0x2f00, 0x2fd5], // Kangxi Radicals
  [0x2ff0, 0x2ffb], // Ideographic Description Characters
  [0x3000, 0x303e], // CJK Symbols and Punctuation
  [0x3041, 0x3096], // Hiragana
  [0x3099, 0x30ff], // Katakana
  [0x3105, 0x312d], // Bopomofo
  [0x3131, 0x318e], // Hangul Compatibility Jamo
  [0x3190, 0x31ba], // Kanbun
  [0x31c0, 0x31e3], // CJK Strokes
  [0x31f0, 0x321e], // Katakana Phonetic Extensions
  [0x3220, 0x3247], // Enclosed CJK Letters and Months
  [0x3250, 0x32fe],
  [0x3300, 0x4dbf], // CJK Unified Ideographs Extension A
  [0x4e00, 0xa48c], // CJK Unified Ideographs
  [0xa490, 0xa4c6], // Yi Radicals
  [0xac00, 0xd7a3], // Hangul Syllables
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
  [0xfe10, 0xfe19], // Vertical forms
  [0xfe30, 0xfe6b], // CJK Compatibility Forms
  [0xff01, 0xff60], // Fullwidth ASCII variants
  [0xffe0, 0xffe6], // Fullwidth symbol variants
  [0x1f200, 0x1f251], // Enclosed Ideographic Supplement
  [0x20000, 0x2fffd], // CJK Unified Ideographs Extension B-F
  [0x30000, 0x3fffd],
];

/**
 * TextMeasurer class for accurate text width calculation
 */
export class TextMeasurer {
  private cache: Map<string, TextMeasurement>;
  private cacheSize: number;
  private readonly maxCacheSize: number;

  constructor(maxCacheSize = 1000) {
    this.cache = new Map();
    this.cacheSize = 0;
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Measure the display width of text
   * @param text - The text to measure
   * @param useCache - Whether to use caching (default: true)
   * @returns Text measurement result
   */
  public measure(text: string, useCache = true): TextMeasurement {
    if (useCache && this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    const measurement = this.measureInternal(text);

    if (useCache) {
      this.addToCache(text, measurement);
    }

    return measurement;
  }

  /**
   * Get only the display width of text
   * @param text - The text to measure
   * @returns Display width in columns
   */
  public getWidth(text: string): number {
    return this.measure(text).displayWidth;
  }

  /**
   * Strip ANSI codes from text
   * @param text - Text with potential ANSI codes
   * @returns Text without ANSI codes
   */
  public stripAnsi(text: string): string {
    return text.replace(ANSI_REGEX, '');
  }

  /**
   * Truncate text to fit within a maximum width
   * @param text - Text to truncate
   * @param maxWidth - Maximum display width
   * @param ellipsis - Ellipsis string (default: '...')
   * @returns Truncated text
   */
  public truncate(text: string, maxWidth: number, ellipsis = '...'): string {
    const stripped = this.stripAnsi(text);
    const currentWidth = this.getWidth(stripped);

    if (currentWidth <= maxWidth) {
      return text;
    }

    const ellipsisWidth = this.getWidth(ellipsis);
    const targetWidth = maxWidth - ellipsisWidth;

    if (targetWidth <= 0) {
      return ellipsis.slice(0, maxWidth);
    }

    let result = '';
    let width = 0;

    for (const char of stripped) {
      const charWidth = this.getCharWidth(char);
      if (width + charWidth > targetWidth) {
        break;
      }
      result += char;
      width += charWidth;
    }

    return result + ellipsis;
  }

  /**
   * Pad text to a specific width
   * @param text - Text to pad
   * @param width - Target width
   * @param align - Alignment ('left' | 'right' | 'center')
   * @returns Padded text
   */
  public pad(
    text: string,
    width: number,
    align: 'left' | 'right' | 'center' = 'left'
  ): string {
    const currentWidth = this.getWidth(this.stripAnsi(text));
    const padding = width - currentWidth;

    if (padding <= 0) {
      return text;
    }

    const spaces = ' '.repeat(padding);

    switch (align) {
      case 'right':
        return spaces + text;
      case 'center':
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
      case 'left':
      default:
        return text + spaces;
    }
  }

  /**
   * Clear the measurement cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.cacheSize = 0;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cacheSize,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }

  /**
   * Internal measurement implementation
   */
  private measureInternal(text: string): TextMeasurement {
    const hasAnsiCodes = ANSI_REGEX.test(text);
    const stripped = hasAnsiCodes ? this.stripAnsi(text) : text;

    let displayWidth = 0;
    let hasMultibyte = false;

    for (const char of stripped) {
      const width = this.getCharWidth(char);
      displayWidth += width;
      if (width > 1) {
        hasMultibyte = true;
      }
    }

    return {
      displayWidth,
      byteLength: Buffer.byteLength(text, 'utf8'),
      charCount: stripped.length,
      hasMultibyte,
      hasAnsiCodes,
    };
  }

  /**
   * Get the display width of a single character
   */
  private getCharWidth(char: string): number {
    const codePoint = char.codePointAt(0);

    if (codePoint === undefined) {
      return 0;
    }

    // Control characters
    if (codePoint < 32 || (codePoint >= 127 && codePoint < 160)) {
      return 0;
    }

    // Check if it's a full-width character
    if (this.isFullWidth(codePoint)) {
      return 2;
    }

    // Default to half-width
    return 1;
  }

  /**
   * Check if a code point represents a full-width character
   */
  private isFullWidth(codePoint: number): boolean {
    for (const [start, end] of FULLWIDTH_RANGES) {
      if (codePoint >= start && codePoint <= end) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add measurement to cache with size management
   */
  private addToCache(text: string, measurement: TextMeasurement): void {
    if (this.cacheSize >= this.maxCacheSize) {
      // Simple FIFO eviction - remove first entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        this.cacheSize--;
      }
    }

    this.cache.set(text, measurement);
    this.cacheSize++;
  }
}

/**
 * Singleton instance for default usage
 */
export const defaultMeasurer = new TextMeasurer();

/**
 * Convenience function for measuring text width
 */
export function measureWidth(text: string): number {
  return defaultMeasurer.getWidth(text);
}

/**
 * Convenience function for stripping ANSI codes
 */
export function stripAnsi(text: string): string {
  return defaultMeasurer.stripAnsi(text);
}

/**
 * Convenience function for truncating text
 */
export function truncateText(
  text: string,
  maxWidth: number,
  ellipsis?: string
): string {
  return defaultMeasurer.truncate(text, maxWidth, ellipsis);
}
