import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency } from './utils.ts';

describe('formatCurrency', () => {
  it('should format positive integers correctly', () => {
    assert.strictEqual(formatCurrency(100), '฿100.00');
    assert.strictEqual(formatCurrency(5), '฿5.00');
  });

  it('should format decimal numbers correctly', () => {
    assert.strictEqual(formatCurrency(1234.56), '฿1,234.56');
    assert.strictEqual(formatCurrency(1234.5), '฿1,234.50');
  });

  it('should format zero correctly', () => {
    assert.strictEqual(formatCurrency(0), '฿0.00');
  });

  it('should format negative numbers correctly', () => {
    assert.strictEqual(formatCurrency(-500), '-฿500.00');
    assert.strictEqual(formatCurrency(-1234.56), '-฿1,234.56');
  });

  it('should handle large numbers correctly', () => {
    assert.strictEqual(formatCurrency(1000000), '฿1,000,000.00');
    assert.strictEqual(formatCurrency(123456789.99), '฿123,456,789.99');
  });
});
