import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, formatDateTime } from './formatters';
import { numberToWords } from './numberToWords';

describe('formatDate', () => {
  it('formats YYYY-MM-DD date into dd-MMM-yyyy format', () => {
    expect(formatDate('2026-10-15')).toBe('15-Oct-2026');
    expect(formatDate('2022-03-01')).toBe('01-Mar-2022');
    expect(formatDate('2024-12-25')).toBe('25-Dec-2024');
  });

  it('formats ISO datetime strings properly', () => {
    expect(formatDate('2026-05-18T14:30:00Z')).toBe('18-May-2026');
  });

  it('handles empty or null values gracefully', () => {
    expect(formatDate('')).toBe('—');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});

describe('formatCurrency', () => {
  it('formats positive amounts with INR ₹ symbol and 2 decimals', () => {
    expect(formatCurrency(135000)).toContain('₹');
    expect(formatCurrency(135000)).toContain('1,35,000.00');
    expect(formatCurrency(50000)).toContain('50,000.00');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('₹ 0.00');
  });

  it('handles null, undefined, or NaN safely', () => {
    expect(formatCurrency(null)).toBe('₹ 0.00');
    expect(formatCurrency(undefined)).toBe('₹ 0.00');
    expect(formatCurrency('invalid')).toBe('₹ 0.00');
  });
});

describe('numberToWords', () => {
  it('converts hundreds correctly', () => {
    expect(numberToWords(500)).toBe('Five Hundred Rupees');
  });

  it('converts thousands correctly', () => {
    expect(numberToWords(50000)).toBe('Fifty Thousand Rupees');
  });

  it('converts lakhs correctly in Indian numbering system', () => {
    expect(numberToWords(1250000)).toBe('Twelve Lakh Fifty Thousand Rupees');
    expect(numberToWords(100000)).toBe('One Lakh Rupees');
  });

  it('handles zero correctly', () => {
    expect(numberToWords(0)).toBe('Zero Rupees');
  });

  it('handles empty or negative values safely', () => {
    expect(numberToWords('')).toBe('');
    expect(numberToWords(-50)).toBe('');
    expect(numberToWords(null)).toBe('');
  });
});
