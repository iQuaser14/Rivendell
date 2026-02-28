import { z } from 'zod';
import type { Result } from '../models/types.js';
import { ok, err } from '../models/types.js';
import type { TradeSide, FlowType, Currency } from '../models/enums.js';
import { parseDateFineco } from '../utils/dates.js';

// ============================================================
// Fineco operation mapping
// ============================================================
const OPERATION_MAP: Record<string, TradeSide | FlowType> = {
  Acquisto: 'BUY',
  acquisto: 'BUY',
  Vendita: 'SELL',
  vendita: 'SELL',
  Dividendo: 'dividend',
  dividendo: 'dividend',
};

// ============================================================
// Parsed output types
// ============================================================
export interface ParsedTrade {
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

export interface ParsedDividend {
  flowDate: Date;
  flowType: 'dividend';
  ticker: string;
  isin: string | null;
  currency: Currency;
  amount: number;
}

export type ParsedRow = ParsedTrade | ParsedDividend;

export interface ParseError {
  row: number;
  field: string;
  message: string;
  rawValue?: string;
}

// ============================================================
// Fineco number parsing (comma decimal separator)
// ============================================================
function parseFinecoNumber(value: string): number {
  // "1.234,56" → 1234.56
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = Number(cleaned);
  if (isNaN(num)) throw new Error(`Invalid number: ${value}`);
  return num;
}

// ============================================================
// CSV parsing
// ============================================================
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ============================================================
// Main parser
// ============================================================

/**
 * Parse Fineco CSV export.
 *
 * Expected columns (semicolon-separated):
 * Date;Operation;Ticker;ISIN;Currency;Quantity;Price;Amount;Commission
 *
 * Date format: DD/MM/YYYY
 * Number format: 1.234,56 (dot as thousands sep, comma as decimal)
 */
export function parseFinecoCSV(
  csvContent: string,
): Result<ParsedRow[], ParseError[]> {
  const lines = csvContent.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return err([
      { row: 0, field: 'file', message: 'CSV file is empty or has no data rows' },
    ]);
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const results: ParsedRow[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const rowNum = i + 2; // 1-indexed, accounting for header
    const fields = parseCSVLine(dataLines[i]);

    if (fields.length < 8) {
      errors.push({
        row: rowNum,
        field: 'line',
        message: `Expected at least 8 fields, got ${fields.length}`,
      });
      continue;
    }

    const [dateStr, operation, ticker, isin, currency, quantityStr, priceStr, amountStr, commissionStr] = fields;

    // Validate date
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(dateStr)) {
      errors.push({ row: rowNum, field: 'date', message: 'Invalid date format', rawValue: dateStr });
      continue;
    }

    // Map operation
    const mappedOp = OPERATION_MAP[operation];
    if (!mappedOp) {
      errors.push({ row: rowNum, field: 'operation', message: `Unknown operation: ${operation}`, rawValue: operation });
      continue;
    }

    // Validate currency
    const validCurrencies = ['EUR', 'USD', 'CHF', 'AUD', 'GBP', 'JPY', 'SEK', 'DKK', 'NOK'];
    if (!validCurrencies.includes(currency)) {
      errors.push({ row: rowNum, field: 'currency', message: `Invalid currency: ${currency}`, rawValue: currency });
      continue;
    }

    try {
      const parsedDate = parseDateFineco(dateStr);

      if (mappedOp === 'dividend') {
        const amount = parseFinecoNumber(amountStr);
        results.push({
          flowDate: parsedDate,
          flowType: 'dividend',
          ticker,
          isin: isin || null,
          currency: currency as Currency,
          amount: Math.abs(amount),
        });
      } else {
        const quantity = parseFinecoNumber(quantityStr);
        const price = parseFinecoNumber(priceStr);
        const amount = parseFinecoNumber(amountStr);
        const commission = commissionStr ? parseFinecoNumber(commissionStr) : 0;

        results.push({
          tradeDate: parsedDate,
          side: mappedOp as TradeSide,
          ticker,
          isin: isin || null,
          currency: currency as Currency,
          quantity: Math.abs(quantity),
          price: Math.abs(price),
          amount: Math.abs(amount),
          commission: Math.abs(commission),
        });
      }
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

/** Type guard to distinguish trades from dividends */
export function isParsedTrade(row: ParsedRow): row is ParsedTrade {
  return 'side' in row;
}

/** Type guard for dividends */
export function isParsedDividend(row: ParsedRow): row is ParsedDividend {
  return 'flowType' in row;
}
