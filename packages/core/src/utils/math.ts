import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/** Round to 2 decimal places — for monetary amounts */
export function roundAmount(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Round to 6 decimal places — for rates and prices */
export function roundPrice(value: Decimal): Decimal {
  return value.toDecimalPlaces(6, Decimal.ROUND_HALF_UP);
}

/** Round to 8 decimal places — for FX rates */
export function roundFxRate(value: Decimal): Decimal {
  return value.toDecimalPlaces(8, Decimal.ROUND_HALF_UP);
}

/** Round to 6 decimal places — for percentages stored as decimals */
export function roundPct(value: Decimal): Decimal {
  return value.toDecimalPlaces(6, Decimal.ROUND_HALF_UP);
}

/** Safe division: returns zero if divisor is zero */
export function safeDivide(numerator: Decimal, denominator: Decimal): Decimal {
  if (denominator.isZero()) {
    return new Decimal(0);
  }
  return numerator.div(denominator);
}

/** Create a Decimal from a number or string */
export function d(value: number | string): Decimal {
  return new Decimal(value);
}

/** Sum an array of Decimals */
export function sumDecimals(values: Decimal[]): Decimal {
  return values.reduce((acc, v) => acc.plus(v), new Decimal(0));
}

/** Weighted average of values by weights */
export function weightedAverage(
  values: Decimal[],
  weights: Decimal[],
): Decimal {
  if (values.length !== weights.length || values.length === 0) {
    return new Decimal(0);
  }
  const totalWeight = sumDecimals(weights);
  if (totalWeight.isZero()) return new Decimal(0);
  const weightedSum = values.reduce(
    (acc, v, i) => acc.plus(v.mul(weights[i])),
    new Decimal(0),
  );
  return weightedSum.div(totalWeight);
}

export { Decimal };
