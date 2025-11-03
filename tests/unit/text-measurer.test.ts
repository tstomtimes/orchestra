/**
 * Unit tests for TextMeasurer
 */

import { TextMeasurer } from '../../src/utils/text-measurer';

describe('TextMeasurer', () => {
  let measurer: TextMeasurer;

  beforeEach(() => {
    measurer = new TextMeasurer();
  });

  describe('measure', () => {
    it('should measure ASCII text correctly', () => {
      const result = measurer.measure('Hello World');
      expect(result.displayWidth).toBe(11);
      expect(result.charCount).toBe(11);
      expect(result.hasMultibyte).toBe(false);
      expect(result.hasAnsiCodes).toBe(false);
    });

    it('should measure Japanese hiragana correctly', () => {
      const result = measurer.measure('こんにちは');
      expect(result.displayWidth).toBe(10); // 5 chars * 2 width
      expect(result.charCount).toBe(5);
      expect(result.hasMultibyte).toBe(true);
    });

    it('should measure Japanese kanji correctly', () => {
      const result = measurer.measure('日本語');
      expect(result.displayWidth).toBe(6); // 3 chars * 2 width
      expect(result.charCount).toBe(3);
      expect(result.hasMultibyte).toBe(true);
    });

    it('should measure mixed English and Japanese correctly', () => {
      const result = measurer.measure('Hello 世界');
      expect(result.displayWidth).toBe(10); // 6 + 4
      expect(result.charCount).toBe(8);
      expect(result.hasMultibyte).toBe(true);
    });

    it('should handle ANSI color codes', () => {
      const text = '\x1b[31mRed Text\x1b[0m';
      const result = measurer.measure(text);
      expect(result.displayWidth).toBe(8);
      expect(result.charCount).toBe(8);
      expect(result.hasAnsiCodes).toBe(true);
    });

    it('should handle empty string', () => {
      const result = measurer.measure('');
      expect(result.displayWidth).toBe(0);
      expect(result.charCount).toBe(0);
    });
  });

  describe('getWidth', () => {
    it('should return correct width for ASCII', () => {
      expect(measurer.getWidth('Test')).toBe(4);
    });

    it('should return correct width for Japanese', () => {
      expect(measurer.getWidth('テスト')).toBe(6); // 3 chars * 2
    });
  });

  describe('stripAnsi', () => {
    it('should remove ANSI codes', () => {
      const text = '\x1b[31mRed\x1b[0m \x1b[32mGreen\x1b[0m';
      const stripped = measurer.stripAnsi(text);
      expect(stripped).toBe('Red Green');
    });

    it('should handle text without ANSI codes', () => {
      const text = 'Plain text';
      expect(measurer.stripAnsi(text)).toBe(text);
    });
  });

  describe('truncate', () => {
    it('should truncate long ASCII text', () => {
      const text = 'This is a very long text';
      const truncated = measurer.truncate(text, 10);
      expect(measurer.getWidth(truncated)).toBeLessThanOrEqual(10);
      expect(truncated).toContain('...');
    });

    it('should not truncate short text', () => {
      const text = 'Short';
      const truncated = measurer.truncate(text, 10);
      expect(truncated).toBe(text);
    });

    it('should handle Japanese text truncation', () => {
      const text = 'これは長いテキストです';
      const truncated = measurer.truncate(text, 10);
      expect(measurer.getWidth(truncated)).toBeLessThanOrEqual(10);
    });

    it('should use custom ellipsis', () => {
      const text = 'This is a very long text';
      const truncated = measurer.truncate(text, 10, '…');
      expect(truncated).toContain('…');
    });
  });

  describe('pad', () => {
    it('should pad text to the left', () => {
      const padded = measurer.pad('Test', 10, 'left');
      expect(measurer.getWidth(padded)).toBe(10);
      expect(padded).toBe('Test      ');
    });

    it('should pad text to the right', () => {
      const padded = measurer.pad('Test', 10, 'right');
      expect(measurer.getWidth(padded)).toBe(10);
      expect(padded).toBe('      Test');
    });

    it('should pad text to center', () => {
      const padded = measurer.pad('Test', 10, 'center');
      expect(measurer.getWidth(padded)).toBe(10);
      expect(padded).toMatch(/^\s+Test\s+$/);
    });

    it('should not pad if text is already at target width', () => {
      const text = 'Exact';
      const padded = measurer.pad(text, 5, 'left');
      expect(padded).toBe(text);
    });

    it('should handle Japanese text padding', () => {
      const padded = measurer.pad('日本', 10, 'left');
      expect(measurer.getWidth(padded)).toBe(10);
    });
  });

  describe('cache', () => {
    it('should cache measurement results', () => {
      const text = 'Test string for caching';
      measurer.measure(text);
      measurer.measure(text);

      const stats = measurer.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should clear cache', () => {
      measurer.measure('Test 1');
      measurer.measure('Test 2');
      measurer.clearCache();

      const stats = measurer.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle control characters', () => {
      const text = 'Hello\nWorld\t!';
      const result = measurer.measure(text);
      expect(result.displayWidth).toBeGreaterThan(0);
    });

    it('should handle emoji', () => {
      const text = '👍 Good';
      const result = measurer.measure(text);
      expect(result.displayWidth).toBeGreaterThan(0);
    });

    it('should handle very long strings', () => {
      const text = 'a'.repeat(10000);
      const result = measurer.measure(text);
      expect(result.displayWidth).toBe(10000);
    });
  });
});
