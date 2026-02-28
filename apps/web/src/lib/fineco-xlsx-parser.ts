import * as XLSX from 'xlsx';

export interface ParsedFinecoTrade {
  type: 'trade';
  tradeDate: string;       // YYYY-MM-DD
  description: string;
  name: string;
  isin: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  currency: string;
  price: number;
  fxRate: number;           // 1 EUR = X foreign currency
  eurValue: number;
}

export interface ParsedFinecoDividend {
  type: 'dividend';
  flowDate: string;         // YYYY-MM-DD
  name: string;
  isin: string;
  quantity: number;
  currency: string;
  fxRate: number;
  eurValue: number;
}

export type ParsedFinecoRow = ParsedFinecoTrade | ParsedFinecoDividend;

export interface ParseResult {
  rows: ParsedFinecoRow[];
  errors: string[];
  skipped: number;
}

/**
 * Parse DD/MM/YYYY → YYYY-MM-DD
 */
function parseDate(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return ddmmyyyy;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Parse a Fineco "Lista Titoli" XLSX file.
 *
 * Format:
 * - Rows 0-4: Headers (skip)
 * - Row 5: Column names
 * - Row 6: Empty
 * - Row 7+: Data
 *
 * Columns (0-indexed):
 * [0] Operazione — trade date DD/MM/YYYY
 * [1] Data valuta — settlement date (ignored)
 * [2] Descrizione — "Compravendita titoli" or "Dividendo"
 * [3] Titolo — asset name
 * [4] Isin — ISIN code
 * [5] Segno — "A" (buy), "V" (sell), " " (dividend)
 * [6] Quantita — quantity
 * [7] Divisa — currency (EUR, USD, CHF)
 * [8] Prezzo — price in local currency (0 for dividends)
 * [9] Cambio — FX rate EUR/XXX (1 for EUR)
 * [10] Controvalore in Euro — EUR equivalent
 */
export function parseFinecoXlsx(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

  const rows: ParsedFinecoRow[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // Start from row 7 (skip 0-4 header, 5 column names, 6 empty)
  for (let i = 7; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !Array.isArray(row) || row.length < 10) {
      skipped++;
      continue;
    }

    const dateStr = String(row[0] ?? '').trim();
    const description = String(row[2] ?? '').trim();
    const name = String(row[3] ?? '').trim();
    const isin = String(row[4] ?? '').trim();
    const segno = String(row[5] ?? '').trim();
    const quantity = Number(row[6]) || 0;
    const currency = String(row[7] ?? '').trim();
    const price = Number(row[8]) || 0;
    const fxRate = Number(row[9]) || 1;
    const eurValue = Number(row[10]) || 0;

    if (!dateStr || !name) {
      skipped++;
      continue;
    }

    const parsedDate = parseDate(dateStr);

    // Determine if this is a dividend
    const isDividend = description.toLowerCase().includes('dividendo') ||
      (segno === '' && price === 0) ||
      segno === ' ';

    if (isDividend) {
      rows.push({
        type: 'dividend',
        flowDate: parsedDate,
        name,
        isin,
        quantity,
        currency,
        fxRate,
        eurValue,
      });
    } else {
      // Trade
      const side = segno === 'V' ? 'SELL' : 'BUY';

      if (quantity <= 0) {
        errors.push(`Row ${i + 1}: Invalid quantity ${quantity} for ${name}`);
        continue;
      }
      if (price <= 0) {
        errors.push(`Row ${i + 1}: Invalid price ${price} for ${name}`);
        continue;
      }

      rows.push({
        type: 'trade',
        tradeDate: parsedDate,
        description,
        name,
        isin,
        side,
        quantity,
        currency,
        price,
        fxRate,
        eurValue,
      });
    }
  }

  return { rows, errors, skipped };
}
