import Decimal from 'decimal.js';
import { roundAmount, roundFxRate, safeDivide } from './math.js';

/**
 * Convert a foreign-currency amount to EUR.
 * FX rate convention: 1 EUR = rate units of foreign currency.
 * So EUR amount = foreign amount / rate.
 */
export function convertToEur(
  amount: Decimal,
  currency: string,
  fxRate: Decimal,
): Decimal {
  if (currency === 'EUR') return amount;
  return roundAmount(safeDivide(amount, fxRate));
}

/**
 * Convert a EUR amount to foreign currency.
 * EUR amount * rate = foreign amount.
 */
export function convertFromEur(
  amountEur: Decimal,
  currency: string,
  fxRate: Decimal,
): Decimal {
  if (currency === 'EUR') return amountEur;
  return roundAmount(amountEur.mul(fxRate));
}

/**
 * Get the inverse FX rate (foreign per EUR → EUR per foreign).
 */
export function invertFxRate(rate: Decimal): Decimal {
  return roundFxRate(safeDivide(new Decimal(1), rate));
}
