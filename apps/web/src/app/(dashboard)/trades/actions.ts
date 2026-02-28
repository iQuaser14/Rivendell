'use server';

import { revalidatePath } from 'next/cache';
import { tradeInputSchema, d, isParsedTrade, isParsedDividend } from '@rivendell/core';
import type { ParsedTrade, ParsedDividend } from '@rivendell/core';
import { insertTrade, insertTrades, upsertAsset, insertCashFlow } from '@rivendell/supabase';
import { getServerClient } from '@/lib/supabase/server';

export async function createTrade(formData: FormData): Promise<{ error?: string }> {
  let assetId = formData.get('assetId') as string;
  const ticker = formData.get('ticker') as string;
  const currency = formData.get('currency') as string;

  const client = getServerClient();

  // Auto-create asset if no assetId but ticker is provided
  if (!assetId && ticker) {
    if (!client) return { error: 'Supabase not configured' };
    const { data: asset, error: assetErr } = await upsertAsset({
      ticker,
      asset_class: 'equity',
      currency,
    }, client);
    if (assetErr || !asset) {
      return { error: assetErr?.message ?? 'Failed to create asset' };
    }
    assetId = asset.id;
  }

  const raw = {
    assetId,
    tradeDate: formData.get('tradeDate') as string,
    side: formData.get('side') as string,
    quantity: parseFloat(formData.get('quantity') as string),
    price: parseFloat(formData.get('price') as string),
    currency,
    fxRateToEur: parseFloat(formData.get('fxRateToEur') as string),
    commission: parseFloat(formData.get('commission') as string) || 0,
    tax: parseFloat(formData.get('tax') as string) || 0,
    notes: (formData.get('notes') as string) || undefined,
    tradeGroup: (formData.get('tradeGroup') as string) || undefined,
    source: 'manual' as const,
  };

  const parsed = tradeInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  const input = parsed.data;
  const qty = d(input.quantity);
  const price = d(input.price);
  const fxRate = d(input.fxRateToEur);

  const grossAmount = qty.mul(price);
  const grossAmountEur = fxRate.gt(0) ? grossAmount.div(fxRate) : grossAmount;
  const commission = d(input.commission);
  const tax = d(input.tax);
  const netAmount = grossAmount.plus(commission).plus(tax);
  const netAmountEur = grossAmountEur.plus(commission.div(fxRate)).plus(tax.div(fxRate));

  const { error } = await insertTrade({
    asset_id: input.assetId,
    trade_date: input.tradeDate.toISOString().slice(0, 10),
    settlement_date: input.settlementDate?.toISOString().slice(0, 10) ?? null,
    side: input.side,
    quantity: qty.toNumber(),
    price: price.toNumber(),
    currency: input.currency,
    fx_rate_to_eur: fxRate.toNumber(),
    gross_amount: grossAmount.toDP(2).toNumber(),
    gross_amount_eur: grossAmountEur.toDP(2).toNumber(),
    commission: commission.toNumber(),
    tax: tax.toNumber(),
    net_amount: netAmount.toDP(2).toNumber(),
    net_amount_eur: netAmountEur.toDP(2).toNumber(),
    notes: input.notes ?? null,
    tags: input.tags,
    trade_group: input.tradeGroup ?? null,
    source: input.source,
  }, client);

  if (error) return { error: error.message };
  revalidatePath('/trades');
  revalidatePath('/');
  return {};
}

export async function importTrades(rows: (ParsedTrade | ParsedDividend)[]): Promise<{ error?: string }> {
  const client = getServerClient();
  if (!client) return { error: 'Supabase not configured' };

  const tradeInserts = [];
  const dividendInserts = [];

  for (const row of rows) {
    // Upsert asset by ticker
    const { data: asset } = await upsertAsset({
      ticker: row.ticker,
      isin: row.isin ?? undefined,
      asset_class: 'equity',
      currency: row.currency,
    }, client);

    if (!asset) continue;

    if (isParsedTrade(row)) {
      const qty = d(row.quantity);
      const price = d(row.price);
      const amount = d(row.amount);
      const comm = d(row.commission ?? 0);
      // Assume FX rate 1 for now, will need lookup for non-EUR
      const fxRate = d(1);

      tradeInserts.push({
        asset_id: asset.id,
        trade_date: row.tradeDate instanceof Date ? row.tradeDate.toISOString().slice(0, 10) : String(row.tradeDate),
        side: row.side,
        quantity: qty.toNumber(),
        price: price.toNumber(),
        currency: row.currency,
        fx_rate_to_eur: fxRate.toNumber(),
        gross_amount: amount.abs().toDP(2).toNumber(),
        gross_amount_eur: amount.abs().div(fxRate).toDP(2).toNumber(),
        commission: comm.toNumber(),
        tax: 0,
        net_amount: amount.abs().plus(comm).toDP(2).toNumber(),
        net_amount_eur: amount.abs().plus(comm).div(fxRate).toDP(2).toNumber(),
        source: 'fineco_csv' as const,
      });
    } else if (isParsedDividend(row)) {
      const flowDate = row.flowDate instanceof Date ? row.flowDate.toISOString().slice(0, 10) : String(row.flowDate);
      dividendInserts.push({
        flow_date: flowDate,
        flow_type: 'dividend',
        amount: row.amount,
        currency: row.currency,
        asset_id: asset.id,
      });
    }
  }

  if (tradeInserts.length > 0) {
    const { error } = await insertTrades(tradeInserts, client);
    if (error) return { error: error.message };
  }

  for (const div of dividendInserts) {
    const { error } = await insertCashFlow(div, client);
    if (error) return { error: error.message };
  }

  revalidatePath('/trades');
  revalidatePath('/cash');
  revalidatePath('/');
  return {};
}
