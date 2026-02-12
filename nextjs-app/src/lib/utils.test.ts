import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatCurrency } from './utils.ts';

describe('formatCurrency', () => {
  it('should format positive integer correctly', () => {
    const result = formatCurrency(100);
    // Check for symbol and value separately to avoid whitespace issues
    assert.ok(result.includes('฿'), 'Should contain currency symbol');
    assert.ok(result.includes('100.00'), 'Should contain formatted value');
  });

  it('should format positive float with correct precision', () => {
    const result = formatCurrency(1234.56);
    assert.ok(result.includes('1,234.56'), 'Should verify comma separation and decimals');
  });

  it('should round to 2 decimal places', () => {
    const result = formatCurrency(10.567);
    assert.ok(result.includes('10.57'), 'Should round up');
  });

  it('should format zero correctly', () => {
    const result = formatCurrency(0);
    assert.ok(result.includes('0.00'), 'Should handle zero');
  });

  it('should format negative numbers correctly', () => {
    const result = formatCurrency(-500);
    assert.ok(result.includes('500.00'), 'Should contain value');
    assert.ok(result.includes('-'), 'Should contain negative sign');
  });

  it('should format large numbers with commas', () => {
    const result = formatCurrency(1000000);
    assert.ok(result.includes('1,000,000.00'), 'Should handle millions with commas');
  });

  it('should handle NaN gracefully', () => {
    const result = formatCurrency(NaN);
    assert.ok(result.includes('NaN'), 'Should return NaN representation');
  });

  it('should handle Infinity', () => {
    const result = formatCurrency(Infinity);
    assert.ok(result.includes('∞') || result.includes('Infinity'), 'Should handle Infinity');
  });
});
