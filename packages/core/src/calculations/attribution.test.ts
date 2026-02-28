import { describe, it, expect } from 'vitest';
import {
  calculateBrinsonAttribution,
  calculateContributionToReturn,
} from './attribution.js';
import { d } from '../utils/math.js';

describe('calculateBrinsonAttribution', () => {
  it('calculates Brinson-Fachler for two sectors', () => {
    const portfolioSegments = [
      { segment: 'Energy', weight: d(0.40), return: d(0.12) },
      { segment: 'Tech', weight: d(0.60), return: d(0.08) },
    ];
    const benchmarkSegments = [
      { segment: 'Energy', weight: d(0.30), return: d(0.10) },
      { segment: 'Tech', weight: d(0.70), return: d(0.06) },
    ];
    // Total benchmark return: 0.30*0.10 + 0.70*0.06 = 0.072
    const totalBenchmarkReturn = d(0.072);

    const result = calculateBrinsonAttribution(
      portfolioSegments,
      benchmarkSegments,
      totalBenchmarkReturn,
    );

    expect(result).toHaveLength(2);

    const energy = result.find((r) => r.segment === 'Energy')!;
    const tech = result.find((r) => r.segment === 'Tech')!;

    // Energy allocation: (0.40 - 0.30) × (0.10 - 0.072) = 0.10 × 0.028 = 0.0028
    expect(energy.allocationEffect.toNumber()).toBeCloseTo(0.0028, 6);
    // Energy selection: 0.30 × (0.12 - 0.10) = 0.30 × 0.02 = 0.006
    expect(energy.selectionEffect.toNumber()).toBeCloseTo(0.006, 6);
    // Energy interaction: (0.40 - 0.30) × (0.12 - 0.10) = 0.10 × 0.02 = 0.002
    expect(energy.interactionEffect.toNumber()).toBeCloseTo(0.002, 6);

    // Tech allocation: (0.60 - 0.70) × (0.06 - 0.072) = -0.10 × -0.012 = 0.0012
    expect(tech.allocationEffect.toNumber()).toBeCloseTo(0.0012, 6);
    // Tech selection: 0.70 × (0.08 - 0.06) = 0.70 × 0.02 = 0.014
    expect(tech.selectionEffect.toNumber()).toBeCloseTo(0.014, 6);
  });

  it('handles segments present only in portfolio', () => {
    const portfolioSegments = [
      { segment: 'Crypto', weight: d(0.05), return: d(0.50) },
    ];
    const benchmarkSegments: typeof portfolioSegments = [];
    const totalBenchmarkReturn = d(0.07);

    const result = calculateBrinsonAttribution(
      portfolioSegments,
      benchmarkSegments,
      totalBenchmarkReturn,
    );

    expect(result).toHaveLength(1);
    const crypto = result[0];
    // Allocation: (0.05 - 0) × (0 - 0.07) = 0.05 × -0.07 = -0.0035
    expect(crypto.allocationEffect.toNumber()).toBeCloseTo(-0.0035, 6);
  });
});

describe('calculateContributionToReturn', () => {
  it('calculates contribution per position', () => {
    const positions = [
      {
        assetId: '1',
        ticker: 'SHEL.L',
        beginningWeight: d(0.25),
        localReturn: d(0.08),
        fxReturn: d(0.02),
        totalReturn: d(0.1016),
      },
      {
        assetId: '2',
        ticker: 'CCJ',
        beginningWeight: d(0.15),
        localReturn: d(0.12),
        fxReturn: d(-0.03),
        totalReturn: d(0.0864),
      },
    ];

    const result = calculateContributionToReturn(positions);

    expect(result).toHaveLength(2);

    // SHEL contribution: 0.25 × 0.1016 = 0.0254
    expect(result[0].totalContribution.toNumber()).toBeCloseTo(0.0254, 4);
    // SHEL local contribution: 0.25 × 0.08 = 0.02
    expect(result[0].localContribution.toNumber()).toBeCloseTo(0.02, 4);
    // SHEL fx contribution: 0.25 × 0.02 = 0.005
    expect(result[0].fxContribution.toNumber()).toBeCloseTo(0.005, 4);

    // CCJ contribution: 0.15 × 0.0864 = 0.01296
    expect(result[1].totalContribution.toNumber()).toBeCloseTo(0.01296, 4);
  });
});
