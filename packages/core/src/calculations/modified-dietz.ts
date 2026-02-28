import Decimal from 'decimal.js';
import type { ModifiedDietzInput } from '../models/types.js';
import { calendarDaysBetween } from '../utils/dates.js';
import { safeDivide, d } from '../utils/math.js';

/**
 * Modified Dietz TWR calculation.
 *
 * R_md = (EMV - BMV - CF) / (BMV + Σ(CFi × Wi))
 *
 * Where:
 *   Wi = (CD - Di) / CD
 *   CD = calendar days in period
 *   Di = day of cash flow within period
 */
export function calculateModifiedDietz(input: ModifiedDietzInput): Decimal {
  const { beginningValue, endingValue, cashFlows, periodStart, periodEnd } =
    input;

  const totalDays = calendarDaysBetween(periodStart, periodEnd);
  if (totalDays <= 0) return d(0);

  const cd = new Decimal(totalDays);

  // Sum of all cash flows
  const totalCashFlow = cashFlows.reduce(
    (sum, cf) => sum.plus(cf.amount),
    d(0),
  );

  // Weighted cash flows: Σ(CFi × Wi) where Wi = (CD - Di) / CD
  const weightedCashFlows = cashFlows.reduce((sum, cf) => {
    const di = new Decimal(calendarDaysBetween(periodStart, cf.date));
    const wi = cd.minus(di).div(cd);
    return sum.plus(cf.amount.mul(wi));
  }, d(0));

  const numerator = endingValue.minus(beginningValue).minus(totalCashFlow);
  const denominator = beginningValue.plus(weightedCashFlows);

  return safeDivide(numerator, denominator);
}

/**
 * Geometric compounding of period returns.
 * TWR = Π(1 + R_i) - 1
 */
export function compoundReturns(returns: Decimal[]): Decimal {
  if (returns.length === 0) return d(0);

  const product = returns.reduce(
    (acc, r) => acc.mul(d(1).plus(r)),
    d(1),
  );

  return product.minus(1);
}
