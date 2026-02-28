import Decimal from 'decimal.js';
import { d, safeDivide, sumDecimals } from '../utils/math.js';

/**
 * Annualized Sharpe Ratio.
 * Sharpe = (mean excess return) / std(excess returns) × √252
 *
 * @param returns - array of daily portfolio returns
 * @param riskFreeDaily - daily risk-free rate (default 0)
 */
export function sharpeRatio(
  returns: Decimal[],
  riskFreeDaily: Decimal = d(0),
): Decimal {
  if (returns.length < 2) return d(0);

  const excessReturns = returns.map((r) => r.minus(riskFreeDaily));
  const mean = safeDivide(sumDecimals(excessReturns), d(excessReturns.length));
  const variance = safeDivide(
    excessReturns.reduce((acc, r) => acc.plus(r.minus(mean).pow(2)), d(0)),
    d(excessReturns.length - 1),
  );
  const stdDev = variance.sqrt();

  if (stdDev.isZero()) return d(0);

  return mean.div(stdDev).mul(d(252).sqrt());
}

/**
 * Annualized Sortino Ratio.
 * Uses only downside deviation (negative excess returns).
 */
export function sortinoRatio(
  returns: Decimal[],
  riskFreeDaily: Decimal = d(0),
): Decimal {
  if (returns.length < 2) return d(0);

  const excessReturns = returns.map((r) => r.minus(riskFreeDaily));
  const mean = safeDivide(sumDecimals(excessReturns), d(excessReturns.length));

  const downsideSquares = excessReturns
    .filter((r) => r.isNegative())
    .map((r) => r.pow(2));

  if (downsideSquares.length === 0) return d(0);

  const downsideVariance = safeDivide(
    sumDecimals(downsideSquares),
    d(returns.length), // use total N, not just downside count
  );
  const downsideDev = downsideVariance.sqrt();

  if (downsideDev.isZero()) return d(0);

  return mean.div(downsideDev).mul(d(252).sqrt());
}

/**
 * Maximum drawdown from peak.
 * Returns a negative decimal (e.g., -0.15 for 15% drawdown).
 */
export function maxDrawdown(returns: Decimal[]): Decimal {
  if (returns.length === 0) return d(0);

  let peak = d(1);
  let maxDD = d(0);
  let cumulative = d(1);

  for (const r of returns) {
    cumulative = cumulative.mul(d(1).plus(r));
    if (cumulative.gt(peak)) {
      peak = cumulative;
    }
    const dd = safeDivide(cumulative.minus(peak), peak);
    if (dd.lt(maxDD)) {
      maxDD = dd;
    }
  }

  return maxDD;
}

/**
 * Current drawdown from peak.
 */
export function currentDrawdown(returns: Decimal[]): Decimal {
  if (returns.length === 0) return d(0);

  let peak = d(1);
  let cumulative = d(1);

  for (const r of returns) {
    cumulative = cumulative.mul(d(1).plus(r));
    if (cumulative.gt(peak)) {
      peak = cumulative;
    }
  }

  return safeDivide(cumulative.minus(peak), peak);
}

/**
 * Rolling annualized volatility (standard deviation of returns × √252).
 *
 * @param returns - daily returns
 * @param window - rolling window size (default 30)
 */
export function rollingVolatility(
  returns: Decimal[],
  window = 30,
): Decimal {
  if (returns.length < window) return d(0);

  const recent = returns.slice(-window);
  const mean = safeDivide(sumDecimals(recent), d(recent.length));
  const variance = safeDivide(
    recent.reduce((acc, r) => acc.plus(r.minus(mean).pow(2)), d(0)),
    d(recent.length - 1),
  );

  return variance.sqrt().mul(d(252).sqrt());
}
