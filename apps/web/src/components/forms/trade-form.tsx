'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PnlText } from '@/components/ui/pnl-text';
import { X } from 'lucide-react';
import { tradeInputSchema, CURRENCIES, TradeSide } from '@rivendell/core';
import { formatCurrency } from '@/lib/utils';
import Decimal from 'decimal.js';

interface TradeFormProps {
  assets: { id: string; ticker: string }[];
  onSubmit: (data: FormData) => Promise<{ error?: string }>;
  onClose: () => void;
}

export function TradeForm({ assets, onSubmit, onClose }: TradeFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ grossEur: number; netEur: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updatePreview(form: HTMLFormElement) {
    const data = new FormData(form);
    const qty = parseFloat(data.get('quantity') as string) || 0;
    const price = parseFloat(data.get('price') as string) || 0;
    const fxRate = parseFloat(data.get('fxRateToEur') as string) || 1;
    const comm = parseFloat(data.get('commission') as string) || 0;
    const tax = parseFloat(data.get('tax') as string) || 0;

    const gross = new Decimal(qty).mul(price);
    const grossEur = fxRate > 0 ? gross.div(fxRate).toNumber() : 0;
    const netEur = grossEur + comm + tax;
    setPreview({ grossEur, netEur });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = e.currentTarget;
    const data = new FormData(form);

    // Client-side Zod validation
    const raw = {
      assetId: data.get('assetId'),
      tradeDate: data.get('tradeDate'),
      side: data.get('side'),
      quantity: parseFloat(data.get('quantity') as string),
      price: parseFloat(data.get('price') as string),
      currency: data.get('currency'),
      fxRateToEur: parseFloat(data.get('fxRateToEur') as string),
      commission: parseFloat(data.get('commission') as string) || 0,
      tax: parseFloat(data.get('tax') as string) || 0,
      notes: data.get('notes') || undefined,
      tradeGroup: data.get('tradeGroup') || undefined,
    };

    const result = tradeInputSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? 'form';
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const res = await onSubmit(data);
    setSubmitting(false);
    if (res?.error) {
      setErrors({ form: res.error });
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Add Trade</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <form onSubmit={handleSubmit} onChange={(e) => updatePreview(e.currentTarget)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Asset</label>
              <Select name="assetId" required>
                <option value="">Select asset...</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.ticker}</option>
                ))}
              </Select>
              {errors.assetId && <p className="mt-1 text-xs text-negative">{errors.assetId}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Date</label>
              <Input type="date" name="tradeDate" required />
              {errors.tradeDate && <p className="mt-1 text-xs text-negative">{errors.tradeDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Side</label>
              <Select name="side" required>
                {Object.values(TradeSide).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Quantity</label>
              <Input type="number" name="quantity" step="any" min="0.000001" required />
              {errors.quantity && <p className="mt-1 text-xs text-negative">{errors.quantity}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Price</label>
              <Input type="number" name="price" step="any" min="0.000001" required />
              {errors.price && <p className="mt-1 text-xs text-negative">{errors.price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Currency</label>
              <Select name="currency" required defaultValue="EUR">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">FX Rate (1 EUR = X)</label>
              <Input type="number" name="fxRateToEur" step="any" min="0.000001" defaultValue="1" required />
              {errors.fxRateToEur && <p className="mt-1 text-xs text-negative">{errors.fxRateToEur}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Commission</label>
              <Input type="number" name="commission" step="any" min="0" defaultValue="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Tax</label>
              <Input type="number" name="tax" step="any" min="0" defaultValue="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Notes</label>
              <Input name="notes" placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Trade Group</label>
              <Input name="tradeGroup" placeholder="Optional" />
            </div>
          </div>

          {preview && (
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="mb-1 text-xs text-muted">Cash Impact Preview</p>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Gross EUR</span>
                <PnlText value={-preview.grossEur} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Net EUR (incl. fees)</span>
                <PnlText value={-preview.netEur} />
              </div>
            </div>
          )}

          {errors.form && (
            <p className="text-sm text-negative">{errors.form}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Trade'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
