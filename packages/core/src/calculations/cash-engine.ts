import Decimal from 'decimal.js';
import type { CashImpactPreview, Result } from '../models/types.js';
import type { Currency, TradeSide } from '../models/enums.js';
import { ok, err } from '../models/types.js';
import { d, roundAmount } from '../utils/math.js';

interface TradeForCash {
  side: TradeSide;
  quantity: Decimal;
  price: Decimal;
  currency: Currency;
  commission: Decimal;
  tax: Decimal;
}

interface CashBalances {
  [currency: string]: Decimal;
}

/**
 * Preview the cash impact of a trade before submission.
 */
export function previewCashImpact(
  trade: TradeForCash,
  currentBalances: CashBalances,
): CashImpactPreview {
  const currentBalance = currentBalances[trade.currency] ?? d(0);
  const grossAmount = trade.quantity.mul(trade.price);
  const costs = trade.commission.plus(trade.tax);

  let tradeAmount: Decimal;

  if (trade.side === 'BUY' || trade.side === 'COVER') {
    // Cash decreases: we pay gross + costs
    tradeAmount = roundAmount(grossAmount.plus(costs).negated());
  } else {
    // SELL or SHORT: cash increases: we receive gross - costs
    tradeAmount = roundAmount(grossAmount.minus(costs));
  }

  const projectedBalance = currentBalance.plus(tradeAmount);

  return {
    currency: trade.currency,
    currentBalance,
    tradeAmount,
    projectedBalance,
    sufficient: projectedBalance.gte(0),
  };
}

/**
 * Validate that there is enough cash to execute a BUY or COVER trade.
 * SELL and SHORT always pass (they generate cash).
 */
export function validateCashSufficiency(
  trade: TradeForCash,
  currentBalances: CashBalances,
): Result<CashImpactPreview, string> {
  const preview = previewCashImpact(trade, currentBalances);

  if (trade.side === 'SELL' || trade.side === 'SHORT') {
    return ok(preview);
  }

  if (!preview.sufficient) {
    return err(
      `Insufficient ${trade.currency} balance: have ${preview.currentBalance.toFixed(2)}, ` +
        `need ${preview.tradeAmount.abs().toFixed(2)}`,
    );
  }

  return ok(preview);
}
