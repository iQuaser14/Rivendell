import type Decimal from 'decimal.js';
import type {
  AssetClass,
  Currency,
  TradeSide,
  FlowType,
  ConvictionLevel,
  ThesisStatus,
  TradeSource,
} from './enums.js';

// ============================================================
// Result type — no thrown exceptions in business logic
// ============================================================
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ============================================================
// Domain entities
// ============================================================
export interface Asset {
  id: string;
  ticker: string;
  name: string | null;
  isin: string | null;
  assetClass: AssetClass;
  currency: Currency;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  region: string | null;
  metadata: Record<string, unknown>;
  isBenchmark: boolean;
  createdAt: Date;
}

export interface Trade {
  id: string;
  assetId: string;
  tradeDate: Date;
  settlementDate: Date | null;
  side: TradeSide;
  quantity: Decimal;
  price: Decimal;
  currency: Currency;
  fxRateToEur: Decimal;
  grossAmount: Decimal;
  grossAmountEur: Decimal;
  commission: Decimal;
  tax: Decimal;
  netAmount: Decimal;
  netAmountEur: Decimal;
  notes: string | null;
  tags: string[];
  tradeGroup: string | null;
  source: TradeSource;
  createdAt: Date;
}

export interface Position {
  id: string;
  assetId: string;
  quantity: Decimal;
  avgCostLocal: Decimal;
  avgCostEur: Decimal;
  avgFxRate: Decimal;
  totalCostEur: Decimal;
  firstTradeDate: Date;
  lastTradeDate: Date;
  realizedPnlLocal: Decimal;
  realizedPnlEur: Decimal;
  realizedFxPnlEur: Decimal;
  tradeGroup: string | null;
  updatedAt: Date;
}

export interface CashAccount {
  id: string;
  currency: Currency;
  balance: Decimal;
  updatedAt: Date;
}

export interface CashFlow {
  id: string;
  flowDate: Date;
  flowType: FlowType;
  amount: Decimal;
  currency: Currency;
  fxRateToEur: Decimal | null;
  amountEur: Decimal | null;
  assetId: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface PositionSnapshot {
  id: string;
  snapshotDate: Date;
  assetId: string;
  quantity: Decimal;
  avgCostLocal: Decimal;
  avgCostEur: Decimal;
  avgFxRate: Decimal;
  marketPriceLocal: Decimal;
  marketPriceEur: Decimal;
  fxRateToEur: Decimal;
  marketValueLocal: Decimal;
  marketValueEur: Decimal;
  costBasisEur: Decimal;
  unrealizedPnlEur: Decimal;
  unrealizedPnlPct: Decimal;
  localReturnPct: Decimal;
  fxImpactPct: Decimal;
  totalReturnPct: Decimal;
  weightPct: Decimal;
  contributionToReturn: Decimal | null;
}

export interface PortfolioSnapshot {
  id: string;
  snapshotDate: Date;
  totalEquityEur: Decimal;
  totalInvestedEur: Decimal;
  totalCashEur: Decimal;
  cashBreakdown: Record<Currency, number>;
  dailyPnlEur: Decimal | null;
  dailyReturnPct: Decimal | null;
  modifiedDietzDaily: Decimal | null;
  cumulativeTwr: Decimal | null;
  wtdReturnPct: Decimal | null;
  mtdReturnPct: Decimal | null;
  ytdReturnPct: Decimal | null;
  itdReturnPct: Decimal | null;
  mwrYtd: Decimal | null;
  volatility30d: Decimal | null;
  sharpeRatioYtd: Decimal | null;
  sortinoRatioYtd: Decimal | null;
  maxDrawdownYtd: Decimal | null;
  currentDrawdown: Decimal | null;
  benchmarkMsciWorldEur: Decimal | null;
  benchmarkSp500Eur: Decimal | null;
  excessReturnMsci: Decimal | null;
  excessReturnSp500: Decimal | null;
  attributionSummary: Record<string, unknown> | null;
  allocationByClass: Record<string, number> | null;
  allocationBySector: Record<string, number> | null;
  allocationByRegion: Record<string, number> | null;
  allocationByCurrency: Record<string, number> | null;
  grossExposure: Decimal | null;
  netExposure: Decimal | null;
  longExposure: Decimal | null;
  shortExposure: Decimal | null;
}

export interface FxRate {
  id: string;
  date: Date;
  baseCurrency: string;
  quoteCurrency: Currency;
  rate: Decimal;
  source: string;
}

export interface MarketDataPoint {
  id: string;
  assetId: string;
  date: Date;
  open: Decimal | null;
  high: Decimal | null;
  low: Decimal | null;
  close: Decimal;
  adjClose: Decimal | null;
  volume: number | null;
  source: string;
}

export interface Thesis {
  id: string;
  name: string;
  tradeGroup: string | null;
  thesis: string;
  conviction: ConvictionLevel | null;
  status: ThesisStatus;
  entryDate: Date | null;
  targetExitDate: Date | null;
  catalysts: string[];
  riskFactors: string[];
  targetReturnPct: Decimal | null;
  stopLossPct: Decimal | null;
  actualReturnPct: Decimal | null;
  actualReturnLocalPct: Decimal | null;
  actualFxImpactPct: Decimal | null;
  notes: string | null;
  createdAt: Date;
  closedAt: Date | null;
}

export interface Report {
  id: string;
  reportType: string;
  periodStart: Date;
  periodEnd: Date;
  title: string;
  content: Record<string, unknown>;
  htmlContent: string | null;
  emailSent: boolean;
  emailSentAt: Date | null;
  createdAt: Date;
}

export interface Alert {
  id: string;
  assetId: string | null;
  thesisId: string | null;
  alertType: string;
  threshold: Decimal | null;
  isTriggered: boolean;
  isActive: boolean;
  message: string | null;
  createdAt: Date;
}

// ============================================================
// Calculation interfaces
// ============================================================
export interface ModifiedDietzInput {
  beginningValue: Decimal;
  endingValue: Decimal;
  cashFlows: Array<{
    date: Date;
    amount: Decimal;
  }>;
  periodStart: Date;
  periodEnd: Date;
}

export interface FxDecomposition {
  localReturn: Decimal;
  fxImpact: Decimal;
  crossTerm: Decimal;
  totalReturnEur: Decimal;
}

export interface SegmentData {
  segment: string;
  weight: Decimal;
  return: Decimal;
}

export interface BrinsonAttribution {
  segment: string;
  portfolioWeight: Decimal;
  benchmarkWeight: Decimal;
  portfolioReturn: Decimal;
  benchmarkReturn: Decimal;
  allocationEffect: Decimal;
  selectionEffect: Decimal;
  interactionEffect: Decimal;
  totalEffect: Decimal;
}

export interface ContributionToReturn {
  assetId: string;
  ticker: string;
  beginningWeight: Decimal;
  positionReturn: Decimal;
  localContribution: Decimal;
  fxContribution: Decimal;
  totalContribution: Decimal;
}

export interface CashImpactPreview {
  currency: Currency;
  currentBalance: Decimal;
  tradeAmount: Decimal;
  projectedBalance: Decimal;
  sufficient: boolean;
}
