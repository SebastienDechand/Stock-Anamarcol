import { describe, it, expect } from 'vitest';
import { statusLabelKey } from './item-status.utils';

describe('statusLabelKey', () => {
  it('returns the translation key for a known status', () => {
    expect(statusLabelKey('NEW')).toBe('ITEMS.STATE_NEW');
    expect(statusLabelKey('RMA')).toBe('ITEMS.STATE_RMA');
  });

  it('falls back to the raw value for an unknown status', () => {
    expect(statusLabelKey('unexpected')).toBe('unexpected');
  });
});
