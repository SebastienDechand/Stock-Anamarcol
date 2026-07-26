import { describe, it, expect } from 'vitest';
import { togglePreparationFilter } from './preparation-filter.utils';

describe('togglePreparationFilter', () => {
  it('activates CashGuard and leaves TPV off when both are off', () => {
    const result = togglePreparationFilter({ cgKit: false, tpvKit: false }, 'CashGuard');
    expect(result).toEqual({ cgKit: true, tpvKit: false });
  });

  it('activates Caisse TPV and leaves CashGuard off when both are off', () => {
    const result = togglePreparationFilter({ cgKit: false, tpvKit: false }, 'Caisse TPV');
    expect(result).toEqual({ cgKit: false, tpvKit: true });
  });

  it('deactivates CashGuard when it is already active', () => {
    const result = togglePreparationFilter({ cgKit: true, tpvKit: false }, 'CashGuard');
    expect(result).toEqual({ cgKit: false, tpvKit: false });
  });

  it('deactivates Caisse TPV when it is already active', () => {
    const result = togglePreparationFilter({ cgKit: false, tpvKit: true }, 'Caisse TPV');
    expect(result).toEqual({ cgKit: false, tpvKit: false });
  });

  it('switches from CashGuard to Caisse TPV exclusively', () => {
    const result = togglePreparationFilter({ cgKit: true, tpvKit: false }, 'Caisse TPV');
    expect(result).toEqual({ cgKit: false, tpvKit: true });
  });

  it('switches from Caisse TPV to CashGuard exclusively', () => {
    const result = togglePreparationFilter({ cgKit: false, tpvKit: true }, 'CashGuard');
    expect(result).toEqual({ cgKit: true, tpvKit: false });
  });
});
