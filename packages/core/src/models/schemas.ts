import { z } from 'zod';

const currencySchema = z.enum([
  'EUR', 'USD', 'CHF', 'AUD', 'GBP', 'JPY', 'SEK', 'DKK', 'NOK',
]);

const assetClassSchema = z.enum([
  'equity', 'etf', 'option', 'bond', 'commodity', 'crypto', 'cash',
]);

const tradeSideSchema = z.enum(['BUY', 'SELL', 'SHORT', 'COVER']);

const flowTypeSchema = z.enum([
  'deposit', 'withdrawal', 'dividend', 'interest', 'fee', 'fx_conversion',
]);

const tradeSourceSchema = z.enum(['manual', 'fineco_csv']);

// ============================================================
// Trade input validation
// ============================================================
export const tradeInputSchema = z.object({
  assetId: z.string().uuid(),
  tradeDate: z.coerce.date(),
  settlementDate: z.coerce.date().optional(),
  side: tradeSideSchema,
  quantity: z.number().positive(),
  price: z.number().positive(),
  currency: currencySchema,
  fxRateToEur: z.number().positive(),
  commission: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  tradeGroup: z.string().optional(),
  source: tradeSourceSchema.default('manual'),
});
export type TradeInput = z.infer<typeof tradeInputSchema>;

// ============================================================
// Cash flow input validation
// ============================================================
export const cashFlowInputSchema = z.object({
  flowDate: z.coerce.date(),
  flowType: flowTypeSchema,
  amount: z.number(),
  currency: currencySchema,
  fxRateToEur: z.number().positive().optional(),
  assetId: z.string().uuid().optional(),
  notes: z.string().optional(),
});
export type CashFlowInput = z.infer<typeof cashFlowInputSchema>;

// ============================================================
// Asset input validation
// ============================================================
export const assetInputSchema = z.object({
  ticker: z.string().min(1).max(20),
  name: z.string().max(255).optional(),
  isin: z.string().length(12).optional(),
  assetClass: assetClassSchema,
  currency: currencySchema,
  exchange: z.string().max(20).optional(),
  sector: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  country: z.string().length(3).optional(),
  region: z.enum(['europe', 'north_america', 'asia_pacific', 'emerging']).optional(),
  metadata: z.record(z.unknown()).default({}),
  isBenchmark: z.boolean().default(false),
});
export type AssetInput = z.infer<typeof assetInputSchema>;

// ============================================================
// Fineco CSV row validation
// ============================================================
export const finecoRowSchema = z.object({
  date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be DD/MM/YYYY'),
  operation: z.string().min(1),
  ticker: z.string().min(1),
  isin: z.string().length(12).optional(),
  currency: currencySchema,
  quantity: z.string().min(1),
  price: z.string().min(1),
  amount: z.string().min(1),
  commission: z.string().optional(),
});
export type FinecoRow = z.infer<typeof finecoRowSchema>;

export {
  currencySchema,
  assetClassSchema,
  tradeSideSchema,
  flowTypeSchema,
  tradeSourceSchema,
};
