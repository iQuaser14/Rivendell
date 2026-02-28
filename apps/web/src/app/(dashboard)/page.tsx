import { Header } from '@/components/layout/header';
import { PortfolioHero } from '@/components/dashboard/portfolio-hero';
import { AllocationChart } from '@/components/dashboard/allocation-chart';
import { ExposureCard } from '@/components/dashboard/exposure-card';
import { RiskMetricsCard } from '@/components/dashboard/risk-metrics-card';
import { TopContributors } from '@/components/dashboard/top-contributors';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { DailyPnlChart } from '@/components/charts/daily-pnl-chart';
import { getServerClient } from '@/lib/supabase/server';
import { getLatestSnapshot, getPortfolioCurrent, getPortfolioSnapshots } from '@rivendell/supabase';

export default async function DashboardPage() {
  const client = getServerClient();

  const [snapshotRes, positionsRes, timeseriesRes] = await Promise.all([
    getLatestSnapshot(client),
    getPortfolioCurrent(client),
    getPortfolioSnapshots(undefined, client),
  ]);

  const snapshot = snapshotRes.data ?? null;
  const positions = positionsRes.data ?? [];
  const snapshots = timeseriesRes.data ?? [];

  return (
    <>
      <Header title="Overview" />
      <div className="space-y-6 p-6">
        <PortfolioHero snapshot={snapshot} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PerformanceChart snapshots={snapshots} />
          <AllocationChart snapshot={snapshot} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ExposureCard snapshot={snapshot} />
          <RiskMetricsCard snapshot={snapshot} />
          <TopContributors positions={positions} />
        </div>
        <DailyPnlChart snapshots={snapshots} />
      </div>
    </>
  );
}
