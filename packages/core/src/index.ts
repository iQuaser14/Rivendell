// Models
export * from './models/enums.js';
export * from './models/types.js';
export * from './models/schemas.js';

// Utils
export * from './utils/math.js';
export * from './utils/dates.js';
export * from './utils/fx.js';
export * from './utils/market-hours.js';

// Calculations
export {
  calculateModifiedDietz,
  compoundReturns,
} from './calculations/modified-dietz.js';
export { calculateMWR } from './calculations/mwr.js';
export { decomposeFxReturn } from './calculations/fx-decomposition.js';
export {
  weekToDateReturn,
  monthToDateReturn,
  yearToDateReturn,
  periodReturn,
  monthlyReturns,
} from './calculations/daily-returns.js';
export {
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  currentDrawdown,
  rollingVolatility,
} from './calculations/risk-metrics.js';
export {
  previewCashImpact,
  validateCashSufficiency,
} from './calculations/cash-engine.js';
export {
  excessReturn,
  relativePerformance,
  trackingError,
  informationRatio,
} from './calculations/benchmarks.js';
export {
  calculateBrinsonAttribution,
  calculateContributionToReturn,
} from './calculations/attribution.js';

// Parsers
export {
  parseFinecoCSV,
  isParsedTrade,
  isParsedDividend,
} from './parsers/fineco.js';
export type { ParsedTrade, ParsedDividend, ParsedRow, ParseError } from './parsers/fineco.js';
export { parseGenericCSV } from './parsers/generic-csv.js';
export type { GenericParsedTrade } from './parsers/generic-csv.js';
