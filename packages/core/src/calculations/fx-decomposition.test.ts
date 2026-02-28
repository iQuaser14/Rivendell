import { describe, it, expect } from 'vitest';
import { decomposeFxReturn } from './fx-decomposition.js';
import { d } from '../utils/math.js';

describe('decomposeFxReturn', () => {
  it('decomposes EUR position (no FX impact)', () => {
    // EUR stock: entry 100, current 110, FX rate always 1
    const result = decomposeFxReturn(d(100), d(110), d(1), d(1));
    expect(result.localReturn.toNumber()).toBeCloseTo(0.10, 6);
    expect(result.fxImpact.toNumber()).toBeCloseTo(0, 6);
    expect(result.crossTerm.toNumber()).toBeCloseTo(0, 6);
    expect(result.totalReturnEur.toNumber()).toBeCloseTo(0.10, 6);
  });

  it('decomposes USD position with weakening EUR', () => {
    // USD stock: entry $100, current $110 (10% local return)
    // EUR/USD: entry 1.10, current 1.05 (EUR weakened → positive FX impact)
    // R_fx = (1.10/1.05) - 1 ≈ 0.04762
    // R_total = (1.10) × (1.04762) - 1 ≈ 0.15238
    const result = decomposeFxReturn(d(100), d(110), d(1.10), d(1.05));
    expect(result.localReturn.toNumber()).toBeCloseTo(0.10, 4);
    expect(result.fxImpact.toNumber()).toBeCloseTo(0.04762, 4);
    expect(result.totalReturnEur.toNumber()).toBeCloseTo(0.15238, 3);
    // Cross-term = total - local - fx
    const expectedCross = result.totalReturnEur
      .minus(result.localReturn)
      .minus(result.fxImpact);
    expect(result.crossTerm.toNumber()).toBeCloseTo(expectedCross.toNumber(), 6);
  });

  it('decomposes USD position with strengthening EUR', () => {
    // USD stock: entry $100, current $110 (10% local return)
    // EUR/USD: entry 1.10, current 1.20 (EUR strengthened → negative FX impact)
    // R_fx = (1.10/1.20) - 1 ≈ -0.08333
    const result = decomposeFxReturn(d(100), d(110), d(1.10), d(1.20));
    expect(result.localReturn.toNumber()).toBeCloseTo(0.10, 4);
    expect(result.fxImpact.toNumber()).toBeCloseTo(-0.08333, 4);
    // Total should be less than local return due to negative FX impact
    expect(result.totalReturnEur.toNumber()).toBeLessThan(0.10);
  });

  it('handles flat stock with FX-only movement', () => {
    // Stock price unchanged, but EUR weakened
    // Entry: $50, current: $50, EUR/USD: 1.10 → 1.00
    const result = decomposeFxReturn(d(50), d(50), d(1.10), d(1.00));
    expect(result.localReturn.toNumber()).toBeCloseTo(0, 6);
    // FX impact = (1.10/1.00) - 1 = 0.10
    expect(result.fxImpact.toNumber()).toBeCloseTo(0.10, 4);
    expect(result.totalReturnEur.toNumber()).toBeCloseTo(0.10, 4);
    // Cross-term should be ~0 (localReturn is 0)
    expect(result.crossTerm.toNumber()).toBeCloseTo(0, 6);
  });

  it('verifies total = (1+local)*(1+fx) - 1 identity', () => {
    const result = decomposeFxReturn(d(80), d(100), d(1.30), d(1.25));
    const expected = d(1)
      .plus(result.localReturn)
      .mul(d(1).plus(result.fxImpact))
      .minus(1);
    expect(result.totalReturnEur.toNumber()).toBeCloseTo(
      expected.toNumber(),
      10,
    );
  });
});
