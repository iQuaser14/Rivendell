// @rivendell/supabase — DB client, generated types, query helpers

// Types
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Views } from './database.types.js';

// Client
export { createBrowserClient, createServerClient } from './client.js';
export type { TypedSupabaseClient } from './client.js';

// Query helpers
export { getTrades, insertTrade, insertTrades } from './queries/trades.js';
export type { GetTradesOptions } from './queries/trades.js';

export { getPortfolioCurrent, getPositionByAsset } from './queries/positions.js';

export { getLatestSnapshot, getPortfolioSnapshots } from './queries/snapshots.js';
export type { SnapshotRangeOptions } from './queries/snapshots.js';

export { getCashSummary, getCashFlows, insertCashFlow } from './queries/cash.js';
export type { GetCashFlowsOptions } from './queries/cash.js';

export { getAssets, getAssetByTicker, getAssetByIsin, upsertAsset } from './queries/assets.js';

export { getLatestFxRates } from './queries/fx.js';
