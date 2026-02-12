import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cn, formatCurrency, formatDate, formatDateTime, generateHNCode } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('c-1', 'c-2');
      assert.equal(result, 'c-1 c-2');
    });

    it('should handle conditional classes', () => {
      const result = cn('c-1', true && 'c-2', false && 'c-3');
      assert.equal(result, 'c-1 c-2');
    });

    it('should handle arrays', () => {
      const result = cn(['c-1', 'c-2']);
      assert.equal(result, 'c-1 c-2');
    });

    it('should handle mixed inputs', () => {
      const result = cn('c-1', ['c-2', 'c-3'], { 'c-4': true, 'c-5': false });
      assert.equal(result, 'c-1 c-2 c-3 c-4');
    });

    it('should return empty string for no inputs', () => {
      const result = cn();
      assert.equal(result, '');
    });

    // Note: Conflict resolution (e.g., p-2 vs p-4) is handled by tailwind-merge.
    // Since we are mocking tailwind-merge in this environment, we cannot verify exact conflict resolution behavior here.
    // However, we verify that cn correctly integrates clsx and passes the result to the merge function.
  });

  describe('formatCurrency', () => {
    it('should format number as Thai Baht', () => {
      const result = formatCurrency(1000);
      // Verify currency symbol and formatting
      assert.ok(result.includes('฿') || result.includes('THB'));
      assert.ok(result.includes('1,000'));
    });

    it('should format decimal numbers', () => {
        const result = formatCurrency(1234.56);
        assert.ok(result.includes('1,234.56'));
    });
  });

  describe('formatDate', () => {
    it('should format date in Thai locale (Buddhist year)', () => {
      const date = new Date('2023-01-01T00:00:00Z');
      const result = formatDate(date);
      // Check for Buddhist year 2566 (2023 + 543)
      assert.ok(result.includes('2566'), 'Should contain Buddhist year 2566');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time in Thai locale', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = formatDateTime(date);
      // Check for Buddhist year 2566
      assert.ok(result.includes('2566'), 'Should contain Buddhist year 2566');
      // Check for time format (HH:mm)
      assert.match(result, /\d{1,2}:\d{2}/, 'Should contain time component');
    });
  });

  describe('generateHNCode', () => {
    it('should generate code starting with HN', () => {
      const code = generateHNCode();
      assert.ok(code.startsWith('HN'));
    });

    it('should generate unique codes', () => {
        const code1 = generateHNCode();
        const code2 = generateHNCode();
        assert.notEqual(code1, code2);
    });
  });
});
