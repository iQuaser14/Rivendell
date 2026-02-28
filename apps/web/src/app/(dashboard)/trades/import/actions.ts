'use server';

import { revalidatePath } from 'next/cache';
import { d } from '@rivendell/core';
import { insertTrade, insertTrades, upsertAsset, insertCashFlow, getAssetByIsin } from '@rivendell/supabase';
import { getServerClient } from '@/lib/supabase/server';
import type { ParsedFinecoTrade, ParsedFinecoDividend, ParsedFinecoRow } from '@/lib/fineco-xlsx-parser';

interface ImportResult {
  tradesImported: number;
  dividendsImported: number;
  totalEurValue: number;
  errors: string[];
}

export async function importFinecoRows(rows: ParsedFinecoRow[]): Promise<ImportResult> {
  const client = getServerClient();
  if (!client) return { tradesImported: 0, dividendsImported: 0, totalEurValue: 0, errors: ['Supabase not configured'] };

  const result: ImportResult = {
    tradesImported: 0,
    dividendsImported: 0,
    totalEurValue: 0,
    errors: [],
  };

  // Cache resolved assets by ISIN to avoid repeated lookups
  const assetCache = new Map<string, string>();

  async function resolveAssetId(isin: string, name: string, currency: string): Promise<string | null> {
    if (assetCache.has(isin)) return assetCache.get(isin)!;

    // Try to find existing asset by ISIN
    const { data: existing } = await getAssetByIsin(isin, client);
    if (existing) {
      assetCache.set(isin, existing.id);
      return existing.id;
    }

    // Create new asset
    // Derive a ticker from the name (Fineco doesn't give us tickers)
    const ticker = name.replace(/\s+/g, '.').substring(0, 20).toUpperCase();

    // Determine asset class from ISIN prefix or name heuristics
    let assetClass = 'equity';
    const nameLower = name.toLowerCase();
    if (nameLower.includes('etf') || nameLower.includes('ishs') || nameLower.includes('mul l') ||
        nameLower.includes('glb x') || nameLower.includes('silver/') || nameLower.includes('gold/')) {
      assetClass = 'etf';
    }

    const { data: newAsset, error } = await upsertAsset({
      ticker,
      name,
      isin,
      asset_class: assetClass,
      currency,
    }, client);

    if (error || !newAsset) {
      result.errors.push(`Failed to create asset for ${name} (${isin}): ${error?.message ?? 'unknown'}`);
      return null;
    }

    assetCache.set(isin, newAsset.id);
    return newAsset.id;
  }

  for (const row of rows) {
    const assetId = await resolveAssetId(row.isin, row.name, row.currency);
    if (!assetId) continue;

    if (row.type === 'trade') {
      const trade = row as ParsedFinecoTrade;
      const qty = d(trade.quantity);
      const price = d(trade.price);
      const fxRate = d(trade.fxRate);

      const grossAmount = qty.mul(price);
      const grossAmountEur = fxRate.gt(0) ? grossAmount.div(fxRate) : grossAmount;

      // Fineco eurValue includes commission — derive commission
      const eurValueD = d(trade.eurValue);
      const impliedCommissionEur = eurValueD.minus(grossAmountEur).abs();
      const commission = impliedCommissionEur.mul(fxRate); // commission in local currency

      const netAmount = trade.side === 'BUY'
        ? grossAmount.plus(commission)
        : grossAmount.minus(commission);
      const netAmountEur = fxRate.gt(0) ? netAmount.div(fxRate) : netAmount;

      const { error } = await insertTrade({
        asset_id: assetId,
        trade_date: trade.tradeDate,
        side: trade.side,
        quantity: qty.toNumber(),
        price: price.toNumber(),
        currency: trade.currency,
        fx_rate_to_eur: fxRate.toNumber(),
        gross_amount: grossAmount.toDP(2).toNumber(),
        gross_amount_eur: grossAmountEur.toDP(2).toNumber(),
        commission: commission.toDP(4).toNumber(),
        tax: 0,
        net_amount: netAmount.toDP(2).toNumber(),
        net_amount_eur: netAmountEur.toDP(2).toNumber(),
        notes: null,
        tags: [],
        trade_group: null,
        source: 'fineco_csv',
      }, client);

      if (error) {
        result.errors.push(`Trade ${trade.name} ${trade.tradeDate}: ${error.message}`);
      } else {
        result.tradesImported++;
        result.totalEurValue += trade.eurValue;
      }
    } else {
      // Dividend
      const div = row as ParsedFinecoDividend;
      const { error } = await insertCashFlow({
        flow_date: div.flowDate,
        flow_type: 'dividend',
        amount: div.eurValue * (div.fxRate || 1), // amount in local currency
        currency: div.currency,
        fx_rate_to_eur: div.fxRate,
        amount_eur: div.eurValue,
        asset_id: assetId,
        notes: `Fineco dividend - ${div.name}`,
      }, client);

      if (error) {
        result.errors.push(`Dividend ${div.name} ${div.flowDate}: ${error.message}`);
      } else {
        result.dividendsImported++;
        result.totalEurValue += div.eurValue;
      }
    }
  }

  revalidatePath('/trades');
  revalidatePath('/positions');
  revalidatePath('/cash');
  revalidatePath('/');

  return result;
}
