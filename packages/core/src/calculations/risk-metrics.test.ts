import { describe, it, expect } from 'vitest';
import {
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  currentDrawdown,
  rollingVolatility,
} from './risk-metrics.js';
import { d } from '../utils/math.js';

describe('sharpeRatio', () => {
  it('returns 0 for fewer than 2 returns', () => {
    expect(sharpeRatio([d(0.01)]).toNumber()).toBe(0);
  });

  it('calculates positive Sharpe for mostly positive returns', () => {
    // Varying positive returns with some noise
    const returns = Array.from({ length: 60 }, (_, i) =>
      d(i % 3 === 0 ? 0.002 : 0.001),
    );
    const result = sharpeRatio(returns);
    expect(result.toNumber()).toBeGreaterThan(0);
  });

  it('returns 0 when all returns are identical (zero std dev)', () => {
    // With risk-free = 0.001, all returns = 0.001 → excess = 0 → Sharpe = 0
    const returns = Array(30).fill(d(0.001));
    const result = sharpeRatio(returns, d(0.001));
    expect(result.toNumber()).toBeCloseTo(0, 6);
  });
});

describe('sortinoRatio', () => {
  it('returns 0 for fewer than 2 returns', () => {
    expect(sortinoRatio([d(0.01)]).toNumber()).toBe(0);
  });

  it('returns 0 when no downside returns exist', () => {
    const returns = [d(0.01), d(0.02), d(0.015)];
    const result = sortinoRatio(returns);
    expect(result.toNumber()).toBe(0);
  });

  it('calculates Sortino with mixed returns', () => {
    const returns = [d(0.02), d(-0.01), d(0.03), d(-0.005), d(0.01)];
    const result = sortinoRatio(returns);
    expect(result.toNumber()).toBeGreaterThan(0);
  });
});

describe('maxDrawdown', () => {
  it('returns 0 for empty array', () => {
    expect(maxDrawdown([]).toNumber()).toBe(0);
  });

  it('returns 0 for always-increasing returns', () => {
    const returns = [d(0.01), d(0.02), d(0.01)];
    expect(maxDrawdown(returns).toNumber()).toBe(0);
  });

  it('calculates max drawdown correctly', () => {
    // Start at 1.0
    // Day 1: +10% → 1.10 (peak)
    // Day 2: -20% → 0.88
    // Day 3: +5%  → 0.924
    // Max DD from peak: (0.88 - 1.10) / 1.10 = -0.2
    const returns = [d(0.10), d(-0.20), d(0.05)];
    const result = maxDrawdown(returns);
    expect(result.toNumber()).toBeCloseTo(-0.2, 4);
  });
});

describe('currentDrawdown', () => {
  it('returns 0 at peak', () => {
    const returns = [d(0.05), d(0.03)];
    expect(currentDrawdown(returns).toNumber()).toBe(0);
  });

  it('shows current drawdown below peak', () => {
    // Peak: 1.10, current: 1.10 * 0.90 = 0.99
    const returns = [d(0.10), d(-0.10)];
    const result = currentDrawdown(returns);
    expect(result.toNumber()).toBeLessThan(0);
  });
});

describe('rollingVolatility', () => {
  it('returns 0 for insufficient data', () => {
    const returns = Array(10).fill(d(0.01));
    expect(rollingVolatility(returns, 30).toNumber()).toBe(0);
  });

  it('calculates annualized vol for stable returns', () => {
    const returns = Array(30).fill(d(0.001));
    const result = rollingVolatility(returns, 30);
    // All returns identical → variance = 0 → vol = 0
    expect(result.toNumber()).toBeCloseTo(0, 6);
  });

  it('calculates positive vol for varying returns', () => {
    const returns: typeof Decimal.prototype[] = [];
    for (let i = 0; i < 30; i++) {
      returns.push(d(i % 2 === 0 ? 0.01 : -0.005));
    }
    const result = rollingVolatility(returns, 30);
    expect(result.toNumber()).toBeGreaterThan(0);
  });
});
