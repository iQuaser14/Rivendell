import type { Result } from '../models/types.js';
import { ok, err } from '../models/types.js';
import type { TradeSide, Currency } from '../models/enums.js';
import type { ParseError } from './fineco.js';

export interface GenericParsedTrade {
  tradeDate: Date;
  side: TradeSide;
  ticker: string;
  isin: string | null;
  currency: Currency;
  quantity: number;
  price: number;
  amount: number;
  commission: number;
}

/**
 * Parse a standard CSV format with comma separator and ISO dates.
 *
 * Expected columns:
 * date,side,ticker,isin,currency,quantity,price,amount,commission
 *
 * Date format: YYYY-MM-DD
 * Number format: standard (1234.56)
 */
export function parseGenericCSV(
  csvContent: string,
): Result<GenericParsedTrade[], ParseError[]> {
  const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return err([
      { row: 0, field: 'file', message: 'CSV file is empty or has no data rows' },
    ]);
  }

  const dataLines = lines.slice(1);
  const results: GenericParsedTrade[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const rowNum = i + 2;
    const fields = dataLines[i].split(',').map((f) => f.trim());

    if (fields.length < 8) {
      errors.push({
        row: rowNum,
        field: 'line',
        message: `Expected at least 8 fields, got ${fields.length}`,
      });
      continue;
    }

    const [dateStr, side, ticker, isin, currency, quantityStr, priceStr, amountStr, commissionStr] = fields;

    // Validate side
    const validSides = ['BUY', 'SELL', 'SHORT', 'COVER'];
    if (!validSides.includes(side)) {
      errors.push({ row: rowNum, field: 'side', message: `Invalid side: ${side}`, rawValue: side });
      continue;
    }

    // Validate currency
    const validCurrencies = ['EUR', 'USD', 'CHF', 'AUD', 'GBP', 'JPY', 'SEK', 'DKK', 'NOK'];
    if (!validCurrencies.includes(currency)) {
      errors.push({ row: rowNum, field: 'currency', message: `Invalid currency: ${currency}`, rawValue: currency });
      continue;
    }

    try {
      const tradeDate = new Date(dateStr);
      if (isNaN(tradeDate.getTime())) throw new Error(`Invalid date: ${dateStr}`);

      results.push({
        tradeDate,
        side: side as TradeSide,
        ticker,
        isin: isin || null,
        currency: currency as Currency,
        quantity: Math.abs(Number(quantityStr)),
        price: Math.abs(Number(priceStr)),
        amount: Math.abs(Number(amountStr)),
        commission: commissionStr ? Math.abs(Number(commissionStr)) : 0,
      });
    } catch (e) {
      errors.push({
        row: rowNum,
        field: 'parsing',
        message: e instanceof Error ? e.message : 'Parse error',
      });
    }
  }

  if (errors.length > 0 && results.length === 0) {
    return err(errors);
  }

  return ok(results);
}
