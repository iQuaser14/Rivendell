import { Header } from '@/components/layout/header';
import { CashSummary } from '@/components/dashboard/cash-summary';
import { CashPageClient } from './client';
import { getServerClient } from '@/lib/supabase/server';
import { getCashSummary, getCashFlows } from '@rivendell/supabase';

export default async function CashPage() {
  const client = getServerClient();
  const [summaryRes, flowsRes] = await Promise.all([
    getCashSummary(client),
    getCashFlows({ limit: 100 }, client),
  ]);

  const cashAccounts = (summaryRes.data ?? []) as any[];
  const flows = (flowsRes.data ?? []) as any[];

  return (
    <>
      <Header title="Cash" />
      <div className="w-full space-y-6 p-6">
        <CashSummary cashAccounts={cashAccounts} />
        <CashPageClient flows={flows} />
      </div>
    </>
  );
}
