import Decimal from 'decimal.js';
import type {
  BrinsonAttribution,
  ContributionToReturn,
  SegmentData,
} from '../models/types.js';
import { d } from '../utils/math.js';

/**
 * Brinson-Fachler attribution model.
 *
 * Allocation Effect  = (Wp - Wb) × (Rb - R_total_b)
 * Selection Effect   = Wb × (Rp - Rb)
 * Interaction Effect = (Wp - Wb) × (Rp - Rb)
 * Total Effect       = Allocation + Selection + Interaction
 */
export function calculateBrinsonAttribution(
  portfolioSegments: SegmentData[],
  benchmarkSegments: SegmentData[],
  totalBenchmarkReturn: Decimal,
): BrinsonAttribution[] {
  // Build a map of benchmark segments for lookup
  const benchmarkMap = new Map<string, SegmentData>();
  for (const seg of benchmarkSegments) {
    benchmarkMap.set(seg.segment, seg);
  }

  // Collect all unique segment names
  const allSegments = new Set<string>();
  for (const seg of portfolioSegments) allSegments.add(seg.segment);
  for (const seg of benchmarkSegments) allSegments.add(seg.segment);

  const results: BrinsonAttribution[] = [];

  for (const segment of allSegments) {
    const pSeg = portfolioSegments.find((s) => s.segment === segment);
    const bSeg = benchmarkMap.get(segment);

    const wp = pSeg?.weight ?? d(0);
    const wb = bSeg?.weight ?? d(0);
    const rp = pSeg?.return ?? d(0);
    const rb = bSeg?.return ?? d(0);

    // Brinson-Fachler formulas
    const allocationEffect = wp.minus(wb).mul(rb.minus(totalBenchmarkReturn));
    const selectionEffect = wb.mul(rp.minus(rb));
    const interactionEffect = wp.minus(wb).mul(rp.minus(rb));
    const totalEffect = allocationEffect
      .plus(selectionEffect)
      .plus(interactionEffect);

    results.push({
      segment,
      portfolioWeight: wp,
      benchmarkWeight: wb,
      portfolioReturn: rp,
      benchmarkReturn: rb,
      allocationEffect,
      selectionEffect,
      interactionEffect,
      totalEffect,
    });
  }

  return results;
}

/**
 * Contribution to return per position.
 * Contribution = beginning weight × position return
 * Sum of all contributions = total portfolio return
 */
export function calculateContributionToReturn(
  positions: Array<{
    assetId: string;
    ticker: string;
    beginningWeight: Decimal;
    localReturn: Decimal;
    fxReturn: Decimal;
    totalReturn: Decimal;
  }>,
): ContributionToReturn[] {
  return positions.map((pos) => ({
    assetId: pos.assetId,
    ticker: pos.ticker,
    beginningWeight: pos.beginningWeight,
    positionReturn: pos.totalReturn,
    localContribution: pos.beginningWeight.mul(pos.localReturn),
    fxContribution: pos.beginningWeight.mul(pos.fxReturn),
    totalContribution: pos.beginningWeight.mul(pos.totalReturn),
  }));
}
