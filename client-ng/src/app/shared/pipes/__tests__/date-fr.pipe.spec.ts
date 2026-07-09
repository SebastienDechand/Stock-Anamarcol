import { describe, it, expect } from 'vitest';
import { DateFrPipe } from '../date-fr.pipe';

describe('DateFrPipe', () => {
  const pipe = new DateFrPipe();

  it('should return an empty string for null, undefined or empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should return an empty string for an invalid date string', () => {
    expect(pipe.transform('not-a-date')).toBe('');
  });

  it('should format a valid ISO date string in French locale', () => {
    const result = pipe.transform('2024-03-15T10:30:00.000Z');
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/mars/);
  });

  it('should format a Date object', () => {
    const result = pipe.transform(new Date('2024-01-01T00:00:00.000Z'));
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/janv/);
  });
});
