import { describe, it, expect, beforeEach } from 'vitest';
import { DatePickerRegistry } from './date-picker-registry.service';

describe('DatePickerRegistry', () => {
  let registry: DatePickerRegistry;

  beforeEach(() => {
    registry = new DatePickerRegistry();
  });

  it('reports no picker active initially', () => {
    const id = Symbol('picker');
    expect(registry.isActive(id)).toBe(false);
  });

  it('marks a picker active after open()', () => {
    const id = Symbol('picker');
    registry.open(id);
    expect(registry.isActive(id)).toBe(true);
  });

  it('opening one picker deactivates the previously active one', () => {
    const first = Symbol('first');
    const second = Symbol('second');
    registry.open(first);
    registry.open(second);
    expect(registry.isActive(first)).toBe(false);
    expect(registry.isActive(second)).toBe(true);
  });

  it('close() deactivates the picker when it is the active one', () => {
    const id = Symbol('picker');
    registry.open(id);
    registry.close(id);
    expect(registry.isActive(id)).toBe(false);
  });

  it('close() does nothing when called with an id that is not active', () => {
    const first = Symbol('first');
    const second = Symbol('second');
    registry.open(first);
    registry.close(second);
    expect(registry.isActive(first)).toBe(true);
  });

  it('closeAll() deactivates whichever picker is active', () => {
    const id = Symbol('picker');
    registry.open(id);
    registry.closeAll();
    expect(registry.isActive(id)).toBe(false);
  });
});
