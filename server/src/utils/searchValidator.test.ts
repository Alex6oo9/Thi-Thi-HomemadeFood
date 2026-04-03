import { describe, it, expect } from 'vitest';
import { validateAndSanitizeSearch, escapeRegex } from './searchValidator';

describe('escapeRegex', () => {
  it('should escape special regex characters', () => {
    expect(escapeRegex('test.com')).toBe('test\\.com');
    expect(escapeRegex('test*')).toBe('test\\*');
    expect(escapeRegex('test+')).toBe('test\\+');
    expect(escapeRegex('test?')).toBe('test\\?');
    expect(escapeRegex('test^')).toBe('test\\^');
    expect(escapeRegex('test$')).toBe('test\\$');
    expect(escapeRegex('test{}')).toBe('test\\{\\}');
    expect(escapeRegex('test()')).toBe('test\\(\\)');
    expect(escapeRegex('test[]')).toBe('test\\[\\]');
    expect(escapeRegex('test|')).toBe('test\\|');
    expect(escapeRegex('test\\')).toBe('test\\\\');
  });

  it('should handle strings without special characters', () => {
    expect(escapeRegex('mohinga')).toBe('mohinga');
    expect(escapeRegex('Shan Noodles')).toBe('Shan Noodles');
  });

  it('should handle mixed content', () => {
    expect(escapeRegex('price: $5.99')).toBe('price: \\$5\\.99');
    expect(escapeRegex('qty (1-10)')).toBe('qty \\(1-10\\)');
  });

  it('should handle empty string', () => {
    expect(escapeRegex('')).toBe('');
  });
});

describe('validateAndSanitizeSearch', () => {
  describe('Valid queries', () => {
    it('should accept valid 3-character query', () => {
      const result = validateAndSanitizeSearch('abc');
      expect(result).toBe('abc');
    });

    it('should accept valid longer query', () => {
      const result = validateAndSanitizeSearch('mohinga');
      expect(result).toBe('mohinga');
    });

    it('should trim whitespace', () => {
      const result = validateAndSanitizeSearch('  mohinga  ');
      expect(result).toBe('mohinga');
    });

    it('should accept query with spaces', () => {
      const result = validateAndSanitizeSearch('Shan Noodles');
      expect(result).toBe('Shan Noodles');
    });

    it('should accept 100-character query (max length)', () => {
      const query = 'a'.repeat(100);
      const result = validateAndSanitizeSearch(query);
      expect(result).toBe(query);
    });

    it('should escape special regex characters', () => {
      const result = validateAndSanitizeSearch('test.com');
      expect(result).toBe('test\\.com');
    });

    it('should trim and escape', () => {
      const result = validateAndSanitizeSearch('  test.com  ');
      expect(result).toBe('test\\.com');
    });
  });

  describe('Invalid queries', () => {
    it('should reject empty string', () => {
      const result = validateAndSanitizeSearch('');
      expect(result).toBeNull();
    });

    it('should reject whitespace-only string', () => {
      const result = validateAndSanitizeSearch('   ');
      expect(result).toBeNull();
    });

    it('should reject 1-character query', () => {
      const result = validateAndSanitizeSearch('a');
      expect(result).toBeNull();
    });

    it('should reject 2-character query', () => {
      const result = validateAndSanitizeSearch('ab');
      expect(result).toBeNull();
    });

    it('should reject query exceeding 100 characters', () => {
      const query = 'a'.repeat(101);
      const result = validateAndSanitizeSearch(query);
      expect(result).toBeNull();
    });

    it('should reject undefined', () => {
      const result = validateAndSanitizeSearch(undefined);
      expect(result).toBeNull();
    });

    it('should reject null', () => {
      const result = validateAndSanitizeSearch(null as any);
      expect(result).toBeNull();
    });

    it('should reject non-string types', () => {
      expect(validateAndSanitizeSearch(123 as any)).toBeNull();
      expect(validateAndSanitizeSearch({} as any)).toBeNull();
      expect(validateAndSanitizeSearch([] as any)).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle query that becomes too short after trimming', () => {
      const result = validateAndSanitizeSearch('  ab  ');
      expect(result).toBeNull();
    });

    it('should handle query that becomes valid after trimming', () => {
      const result = validateAndSanitizeSearch('  abc  ');
      expect(result).toBe('abc');
    });

    it('should handle numbers in query', () => {
      const result = validateAndSanitizeSearch('09123456789');
      expect(result).toBe('09123456789');
    });

    it('should handle mixed alphanumeric', () => {
      const result = validateAndSanitizeSearch('Order123');
      expect(result).toBe('Order123');
    });

    it('should handle unicode characters', () => {
      const result = validateAndSanitizeSearch('မုန့်ဟင်းခါး'); // Mohinga in Burmese
      expect(result).toBe('မုန့်ဟင်းခါး');
    });
  });
});
