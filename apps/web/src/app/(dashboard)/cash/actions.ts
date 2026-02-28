'use server';

import { revalidatePath } from 'next/cache';
import { cashFlowInputSchema, d } from '@rivendell/core';
import { insertCashFlow } from '@rivendell/supabase';
import { getServerClient } from '@/lib/supabase/server';

export async function createCashFlow(formData: FormData): Promise<{ error?: string }> {
  const raw = {
    flowDate: formData.get('flowDate') as string,
    flowType: formData.get('flowType') as string,
    amount: parseFloat(formData.get('amount') as string),
    currency: formData.get('currency') as string,
    fxRateToEur: parseFloat(formData.get('fxRateToEur') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  };

  const parsed = cashFlowInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  const input = parsed.data;
  const amount = d(input.amount);
  const fxRate = input.fxRateToEur ? d(input.fxRateToEur) : null;
  const amountEur = fxRate ? amount.div(fxRate).toDP(2).toNumber() : amount.toDP(2).toNumber();

  const client = getServerClient();
  const { error } = await insertCashFlow({
    flow_date: input.flowDate.toISOString().slice(0, 10),
    flow_type: input.flowType,
    amount: amount.toNumber(),
    currency: input.currency,
    fx_rate_to_eur: fxRate?.toNumber() ?? null,
    amount_eur: amountEur,
    asset_id: input.assetId ?? null,
    notes: input.notes ?? null,
  }, client);

  if (error) return { error: error.message };
  revalidatePath('/cash');
  revalidatePath('/');
  return {};
}
