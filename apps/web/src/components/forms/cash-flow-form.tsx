'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { cashFlowInputSchema, CURRENCIES, FlowType } from '@rivendell/core';

interface CashFlowFormProps {
  onSubmit: (data: FormData) => Promise<{ error?: string }>;
  onClose: () => void;
}

export function CashFlowForm({ onSubmit, onClose }: CashFlowFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = e.currentTarget;
    const data = new FormData(form);

    const raw = {
      flowDate: data.get('flowDate'),
      flowType: data.get('flowType'),
      amount: parseFloat(data.get('amount') as string),
      currency: data.get('currency'),
      fxRateToEur: parseFloat(data.get('fxRateToEur') as string) || undefined,
      notes: data.get('notes') || undefined,
    };

    const result = cashFlowInputSchema.safeParse(raw);
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Cash Flow</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Date</label>
              <Input type="date" name="flowDate" required />
              {errors.flowDate && <p className="mt-1 text-xs text-negative">{errors.flowDate}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Type</label>
              <Select name="flowType" required>
                {Object.values(FlowType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Amount</label>
              <Input type="number" name="amount" step="any" required />
              {errors.amount && <p className="mt-1 text-xs text-negative">{errors.amount}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Currency</label>
              <Select name="currency" required defaultValue="EUR">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">FX Rate (1 EUR = X, optional)</label>
            <Input type="number" name="fxRateToEur" step="any" min="0.000001" placeholder="Leave blank for EUR" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Notes</label>
            <Input name="notes" placeholder="Optional" />
          </div>

          {errors.form && <p className="text-sm text-negative">{errors.form}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Cash Flow'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
