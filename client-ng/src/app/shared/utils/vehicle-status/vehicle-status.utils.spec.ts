import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isDateExpired,
  isDateExpiringSoon,
  formatVehicleDate,
  vehicleDateStatus,
  vehicleRevisionStatus,
} from './vehicle-status.utils';

const NOW = new Date('2026-06-15T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isDateExpired', () => {
  it('returns false for undefined', () => {
    expect(isDateExpired(undefined)).toBe(false);
  });

  it('returns true for a date in the past', () => {
    expect(isDateExpired('2026-01-01')).toBe(true);
  });

  it('returns false for a date in the future', () => {
    expect(isDateExpired('2027-01-01')).toBe(false);
  });
});

describe('isDateExpiringSoon', () => {
  it('returns false for undefined', () => {
    expect(isDateExpiringSoon(undefined)).toBe(false);
  });

  it('returns true for a date 10 days from now', () => {
    expect(isDateExpiringSoon('2026-06-25')).toBe(true);
  });

  it('returns false for a date more than 30 days away', () => {
    expect(isDateExpiringSoon('2026-12-01')).toBe(false);
  });

  it('returns false for a date already in the past', () => {
    expect(isDateExpiringSoon('2026-01-01')).toBe(false);
  });
});

describe('formatVehicleDate', () => {
  it('returns "-" for undefined', () => {
    expect(formatVehicleDate(undefined)).toBe('-');
  });

  it('formats using the fr-FR locale by default', () => {
    const result = formatVehicleDate('2026-03-15');
    expect(result).toMatch(/2026/);
  });

  it('formats using the en-GB locale when lang is en', () => {
    const result = formatVehicleDate('2026-03-15', 'en');
    expect(result).toMatch(/2026/);
  });
});

describe('vehicleDateStatus', () => {
  it('returns "none" for undefined', () => {
    expect(vehicleDateStatus(undefined)).toBe('none');
  });

  it('returns "expired" for a past date', () => {
    expect(vehicleDateStatus('2026-01-01')).toBe('expired');
  });

  it('returns "soon" for a date within 30 days', () => {
    expect(vehicleDateStatus('2026-06-25')).toBe('soon');
  });

  it('returns "ok" for a date far in the future', () => {
    expect(vehicleDateStatus('2027-01-01')).toBe('ok');
  });
});

describe('vehicleRevisionStatus', () => {
  it('returns "none" for undefined', () => {
    expect(vehicleRevisionStatus(undefined)).toBe('none');
  });

  it('returns "expired" when the last revision was more than a year ago', () => {
    expect(vehicleRevisionStatus('2025-01-01')).toBe('expired');
  });

  it('returns "soon" when the 1-year due date falls within 30 days', () => {
    // Last revision on 2025-06-20 -> due 2026-06-20, 5 days from "now"
    expect(vehicleRevisionStatus('2025-06-20')).toBe('soon');
  });

  it('returns "ok" when the 1-year due date is far in the future', () => {
    // Last revision on 2026-01-01 -> due 2027-01-01
    expect(vehicleRevisionStatus('2026-01-01')).toBe('ok');
  });
});
