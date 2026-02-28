import { Header } from '@/components/layout/header';
import { TradesTable } from '@/components/tables/trades-table';
import { TradesPageClient } from './client';
import { getServerClient } from '@/lib/supabase/server';
import { getTrades, getAssets } from '@rivendell/supabase';

export default async function TradesPage() {
  const client = getServerClient();
  const [tradesRes, assetsRes] = await Promise.all([
    getTrades({ limit: 100 }, client),
    getAssets(client),
  ]);

  const trades = (tradesRes.data ?? []) as any[];
  const assets = (assetsRes.data ?? []).map((a: any) => ({ id: a.id, ticker: a.ticker, currency: a.currency }));

  return (
    <>
      <Header title="Trades" />
      <div className="mx-auto w-full max-w-screen-2xl p-3 sm:p-4 md:p-6">
        <TradesPageClient trades={trades} assets={assets} />
      </div>
    </>
  );
}
