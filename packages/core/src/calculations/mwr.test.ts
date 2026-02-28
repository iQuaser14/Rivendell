import { describe, it, expect } from 'vitest';
import { calculateMWR } from './mwr.js';
import { d } from '../utils/math.js';

describe('calculateMWR', () => {
  it('returns correct IRR for simple growth with no cash flows', () => {
    // Start: 100k, End: 110k over 1 year → ~10% annual return
    const result = calculateMWR(
      [],
      d(100000),
      d(110000),
      new Date('2024-01-01'),
      new Date('2024-12-31'),
    );
    expect(result.toNumber()).toBeCloseTo(0.10, 1);
  });

  it('returns correct IRR with a mid-year deposit', () => {
    // Start: 100k, deposit 50k at mid-year, end: 160k over 1 year
    // Without the deposit: 100k→160k but deposit of 50k
    // The MWR should be less than (160k-150k)/150k because 50k was only invested half year
    const result = calculateMWR(
      [{ date: new Date('2024-07-01'), amount: d(50000) }],
      d(100000),
      d(160000),
      new Date('2024-01-01'),
      new Date('2024-12-31'),
    );
    // Should be a moderate positive return
    expect(result.toNumber()).toBeGreaterThan(0);
    expect(result.toNumber()).toBeLessThan(0.20);
  });

  it('returns zero return for flat portfolio', () => {
    const result = calculateMWR(
      [],
      d(100000),
      d(100000),
      new Date('2024-01-01'),
      new Date('2024-12-31'),
    );
    expect(result.toNumber()).toBeCloseTo(0, 2);
  });

  it('returns negative for a loss', () => {
    const result = calculateMWR(
      [],
      d(100000),
      d(90000),
      new Date('2024-01-01'),
      new Date('2024-12-31'),
    );
    expect(result.toNumber()).toBeLessThan(0);
    expect(result.toNumber()).toBeCloseTo(-0.10, 1);
  });
});
