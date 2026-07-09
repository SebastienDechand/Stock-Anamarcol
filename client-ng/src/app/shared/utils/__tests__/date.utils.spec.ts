import { describe, it, expect } from 'vitest';
import { formatDateFr } from '../date.utils';

describe('formatDateFr', () => {
  it('should return an empty string for null, undefined or empty input', () => {
    expect(formatDateFr(null)).toBe('');
    expect(formatDateFr(undefined)).toBe('');
    expect(formatDateFr('')).toBe('');
  });

  it('should return an empty string for an invalid date string', () => {
    expect(formatDateFr('not-a-date')).toBe('');
  });

  it('should format a valid ISO date string in French locale', () => {
    const result = formatDateFr('2024-03-15T10:30:00.000Z');
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/mars/);
  });

  it('should format a Date object', () => {
    const result = formatDateFr(new Date('2024-01-01T00:00:00.000Z'));
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/janv/);
  });
});
