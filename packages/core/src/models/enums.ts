export const AssetClass = {
  EQUITY: 'equity',
  ETF: 'etf',
  OPTION: 'option',
  BOND: 'bond',
  COMMODITY: 'commodity',
  CRYPTO: 'crypto',
  CASH: 'cash',
} as const;
export type AssetClass = (typeof AssetClass)[keyof typeof AssetClass];

export const TradeSide = {
  BUY: 'BUY',
  SELL: 'SELL',
  SHORT: 'SHORT',
  COVER: 'COVER',
} as const;
export type TradeSide = (typeof TradeSide)[keyof typeof TradeSide];

export const FlowType = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  DIVIDEND: 'dividend',
  INTEREST: 'interest',
  FEE: 'fee',
  FX_CONVERSION: 'fx_conversion',
} as const;
export type FlowType = (typeof FlowType)[keyof typeof FlowType];

export const Currency = {
  EUR: 'EUR',
  USD: 'USD',
  CHF: 'CHF',
  AUD: 'AUD',
  GBP: 'GBP',
  JPY: 'JPY',
  SEK: 'SEK',
  DKK: 'DKK',
  NOK: 'NOK',
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

export const CURRENCIES: Currency[] = [
  'EUR', 'USD', 'CHF', 'AUD', 'GBP', 'JPY', 'SEK', 'DKK', 'NOK',
];

export const ConvictionLevel = {
  HIGH: 'HIGH',
  MED: 'MED',
  LOW: 'LOW',
} as const;
export type ConvictionLevel = (typeof ConvictionLevel)[keyof typeof ConvictionLevel];

export const ThesisStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  STOPPED: 'STOPPED',
} as const;
export type ThesisStatus = (typeof ThesisStatus)[keyof typeof ThesisStatus];

export const TradeSource = {
  MANUAL: 'manual',
  FINECO_CSV: 'fineco_csv',
} as const;
export type TradeSource = (typeof TradeSource)[keyof typeof TradeSource];
