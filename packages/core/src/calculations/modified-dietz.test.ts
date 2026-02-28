import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculateModifiedDietz, compoundReturns } from './modified-dietz.js';
import { d } from '../utils/math.js';

describe('calculateModifiedDietz', () => {
  it('returns zero for zero-length period', () => {
    const result = calculateModifiedDietz({
      beginningValue: d(100000),
      endingValue: d(105000),
      cashFlows: [],
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-01'),
    });
    expect(result.toNumber()).toBe(0);
  });

  it('calculates simple return with no cash flows', () => {
    // Start: 100k, End: 105k, no flows → 5% return
    const result = calculateModifiedDietz({
      beginningValue: d(100000),
      endingValue: d(105000),
      cashFlows: [],
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
    });
    expect(result.toNumber()).toBeCloseTo(0.05, 6);
  });

  it('calculates return with a mid-period deposit', () => {
    // Start: 100k, deposit 10k on day 15, end: 115k
    // 30-day period, deposit at day 15 → weight = (30-15)/30 = 0.5
    // R = (115000 - 100000 - 10000) / (100000 + 10000*0.5)
    // R = 5000 / 105000 ≈ 0.04762
    const result = calculateModifiedDietz({
      beginningValue: d(100000),
      endingValue: d(115000),
      cashFlows: [{ date: new Date('2024-01-16'), amount: d(10000) }],
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
    });
    expect(result.toNumber()).toBeCloseTo(0.04762, 4);
  });

  it('handles withdrawal correctly', () => {
    // Start: 100k, withdraw 20k on day 10, end: 82k
    // 30-day period, withdrawal at day 10 → weight = (30-10)/30 = 0.6667
    // R = (82000 - 100000 - (-20000)) / (100000 + (-20000)*0.6667)
    // R = 2000 / 86666 ≈ 0.02308
    const result = calculateModifiedDietz({
      beginningValue: d(100000),
      endingValue: d(82000),
      cashFlows: [{ date: new Date('2024-01-11'), amount: d(-20000) }],
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
    });
    expect(result.toNumber()).toBeCloseTo(0.02308, 3);
  });

  it('handles multiple cash flows', () => {
    // Start: 100k
    // Day 10: deposit 5k
    // Day 20: withdraw 3k
    // End: 107k (31-day period)
    const result = calculateModifiedDietz({
      beginningValue: d(100000),
      endingValue: d(107000),
      cashFlows: [
        { date: new Date('2024-01-11'), amount: d(5000) },
        { date: new Date('2024-01-21'), amount: d(-3000) },
      ],
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-02-01'),
    });
    // Net flows = 2000
    // Numerator = 107000 - 100000 - 2000 = 5000
    // Weight for 5k: (31-10)/31 ≈ 0.6774 → 5000*0.6774 = 3387.1
    // Weight for -3k: (31-20)/31 ≈ 0.3548 → -3000*0.3548 = -1064.5
    // Denominator = 100000 + 3387.1 - 1064.5 = 102322.6
    // R ≈ 5000 / 102322.6 ≈ 0.04886
    expect(result.toNumber()).toBeCloseTo(0.04886, 3);
  });
});

describe('compoundReturns', () => {
  it('returns zero for empty array', () => {
    expect(compoundReturns([]).toNumber()).toBe(0);
  });

  it('returns the single return for one element', () => {
    expect(compoundReturns([d(0.05)]).toNumber()).toBeCloseTo(0.05, 10);
  });

  it('compounds two returns geometrically', () => {
    // (1 + 0.05) × (1 + 0.03) - 1 = 1.0815 - 1 = 0.0815
    const result = compoundReturns([d(0.05), d(0.03)]);
    expect(result.toNumber()).toBeCloseTo(0.0815, 6);
  });

  it('handles negative returns', () => {
    // (1 + 0.10) × (1 + (-0.05)) - 1 = 1.10 × 0.95 - 1 = 0.045
    const result = compoundReturns([d(0.10), d(-0.05)]);
    expect(result.toNumber()).toBeCloseTo(0.045, 6);
  });

  it('compounds daily returns over a month', () => {
    // 22 trading days at 0.1% daily
    const dailyReturns = Array(22).fill(d(0.001));
    const result = compoundReturns(dailyReturns);
    // (1.001)^22 - 1 ≈ 0.02224
    expect(result.toNumber()).toBeCloseTo(0.02224, 4);
  });
});
