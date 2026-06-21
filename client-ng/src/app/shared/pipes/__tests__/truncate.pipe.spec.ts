import { describe, it, expect } from 'vitest';
import { TruncatePipe } from '../truncate.pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('should return an empty string for null or undefined input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return the value unchanged when shorter than the limit', () => {
    expect(pipe.transform('Joint Hooper', 40)).toBe('Joint Hooper');
  });

  it('should truncate and append the default trail when longer than the limit', () => {
    const value = 'A'.repeat(50);
    expect(pipe.transform(value, 40)).toBe('A'.repeat(40) + '…');
  });

  it('should support a custom trail', () => {
    const value = 'A'.repeat(10);
    expect(pipe.transform(value, 5, '...')).toBe('AAAAA...');
  });

  it('should not truncate when the value length equals the limit', () => {
    const value = 'A'.repeat(40);
    expect(pipe.transform(value, 40)).toBe(value);
  });

  it('should use the default limit of 40 when none is provided', () => {
    const value = 'A'.repeat(41);
    expect(pipe.transform(value)).toBe('A'.repeat(40) + '…');
  });
});
