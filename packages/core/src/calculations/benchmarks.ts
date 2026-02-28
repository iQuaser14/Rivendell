import Decimal from 'decimal.js';
import { d } from '../utils/math.js';

/**
 * Calculate excess return of portfolio vs benchmark.
 * Excess = portfolio return - benchmark return
 */
export function excessReturn(
  portfolioReturn: Decimal,
  benchmarkReturn: Decimal,
): Decimal {
  return portfolioReturn.minus(benchmarkReturn);
}

/**
 * Calculate relative performance (geometric).
 * Relative = (1 + Rp) / (1 + Rb) - 1
 */
export function relativePerformance(
  portfolioReturn: Decimal,
  benchmarkReturn: Decimal,
): Decimal {
  const denom = d(1).plus(benchmarkReturn);
  if (denom.isZero()) return d(0);
  return d(1).plus(portfolioReturn).div(denom).minus(1);
}

/**
 * Calculate tracking error (annualized std dev of excess returns).
 */
export function trackingError(
  portfolioReturns: Decimal[],
  benchmarkReturns: Decimal[],
): Decimal {
  if (
    portfolioReturns.length < 2 ||
    portfolioReturns.length !== benchmarkReturns.length
  ) {
    return d(0);
  }

  const excessReturns = portfolioReturns.map((pr, i) =>
    pr.minus(benchmarkReturns[i]),
  );

  const mean = excessReturns
    .reduce((acc, r) => acc.plus(r), d(0))
    .div(d(excessReturns.length));

  const variance = excessReturns
    .reduce((acc, r) => acc.plus(r.minus(mean).pow(2)), d(0))
    .div(d(excessReturns.length - 1));

  return variance.sqrt().mul(d(252).sqrt());
}

/**
 * Information ratio = annualized excess return / tracking error.
 */
export function informationRatio(
  portfolioReturns: Decimal[],
  benchmarkReturns: Decimal[],
): Decimal {
  const te = trackingError(portfolioReturns, benchmarkReturns);
  if (te.isZero()) return d(0);

  const excessReturns = portfolioReturns.map((pr, i) =>
    pr.minus(benchmarkReturns[i]),
  );
  const meanExcess = excessReturns
    .reduce((acc, r) => acc.plus(r), d(0))
    .div(d(excessReturns.length));

  // Annualize
  const annualizedExcess = meanExcess.mul(d(252));

  return annualizedExcess.div(te);
}
