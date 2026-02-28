import { Header } from '@/components/layout/header';
import { PositionsSummary } from '@/components/dashboard/positions-summary';
import { PositionsTable } from '@/components/tables/positions-table';
import { getServerClient } from '@/lib/supabase/server';
import { getPortfolioCurrent } from '@rivendell/supabase';

export default async function PositionsPage() {
  const client = getServerClient();
  const { data } = await getPortfolioCurrent(client);
  const positions = data ?? [];

  return (
    <>
      <Header title="Positions" />
      <div className="mx-auto w-full max-w-screen-2xl space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        <PositionsSummary positions={positions} />
        <PositionsTable positions={positions} />
      </div>
    </>
  );
}
