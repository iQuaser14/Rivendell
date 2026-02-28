import { Header } from '@/components/layout/header';
import { PositionsClient } from './client';
import { getServerClient } from '@/lib/supabase/server';
import { getPortfolioCurrent } from '@rivendell/supabase';

export default async function PositionsPage() {
  const client = getServerClient();
  const { data } = await getPortfolioCurrent(client);
  const positions = data ?? [];

  return (
    <>
      <Header title="Positions" />
      <div className="w-full space-y-6 p-6">
        <PositionsClient positions={positions} />
      </div>
    </>
  );
}
