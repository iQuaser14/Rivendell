import Decimal from 'decimal.js';
import { calendarDaysBetween } from '../utils/dates.js';
import { d } from '../utils/math.js';

interface MwrCashFlow {
  date: Date;
  amount: Decimal; // positive = inflow, negative = outflow
}

/**
 * Money-Weighted Return (MWR) via Newton-Raphson IRR solver.
 *
 * Solves for r in:
 *   endValue = beginValue × (1+r)^T + Σ CFi × (1+r)^(T-ti)
 *
 * Where T = total period in years, ti = time of cash flow in years.
 */
export function calculateMWR(
  cashFlows: MwrCashFlow[],
  beginValue: Decimal,
  endValue: Decimal,
  periodStart: Date,
  periodEnd: Date,
  maxIterations = 100,
  tolerance = 1e-10,
): Decimal {
  const totalDays = calendarDaysBetween(periodStart, periodEnd);
  if (totalDays <= 0) return d(0);

  const T = totalDays / 365.25;

  // Build array of (amount, yearsRemaining) pairs
  // Beginning value is treated as a cash flow at t=0
  const flows: Array<{ amount: number; years: number }> = [
    { amount: beginValue.negated().toNumber(), years: T },
  ];

  for (const cf of cashFlows) {
    const daysSinceStart = calendarDaysBetween(periodStart, cf.date);
    const yearsRemaining = (totalDays - daysSinceStart) / 365.25;
    flows.push({ amount: cf.amount.negated().toNumber(), years: yearsRemaining });
  }

  // End value is a positive terminal cash flow
  flows.push({ amount: endValue.toNumber(), years: 0 });

  // Newton-Raphson: solve Σ flow_i × (1+r)^years_i = 0
  let r = 0.1; // initial guess: 10%

  for (let i = 0; i < maxIterations; i++) {
    let f = 0;
    let fPrime = 0;

    for (const flow of flows) {
      const base = 1 + r;
      if (base <= 0) {
        r = r / 2;
        continue;
      }
      const power = Math.pow(base, flow.years);
      f += flow.amount * power;
      if (flow.years !== 0) {
        fPrime += flow.amount * flow.years * Math.pow(base, flow.years - 1);
      }
    }

    if (Math.abs(fPrime) < 1e-15) break;

    const rNew = r - f / fPrime;

    if (Math.abs(rNew - r) < tolerance) {
      return d(rNew);
    }

    r = rNew;
  }

  return d(r);
}
