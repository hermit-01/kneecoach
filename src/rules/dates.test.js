import { describe, it, expect } from 'vitest';
import { daysBetween, addDays, localToday } from './dates.js';

describe('dates', () => {
  it('counts whole days between two dates', () => {
    expect(daysBetween('2026-10-03', '2026-10-03')).toBe(0);
    expect(daysBetween('2026-10-03', '2026-10-04')).toBe(1);
    expect(daysBetween('2026-09-30', '2026-10-08')).toBe(8);
    expect(daysBetween('2026-10-08', '2026-09-30')).toBe(-8);
  });
  it('adds days across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });
  it('formats the local date as YYYY-MM-DD', () => {
    expect(localToday(new Date(2026, 9, 3, 23, 59))).toBe('2026-10-03');
  });
});
