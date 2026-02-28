'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TradesTable } from '@/components/tables/trades-table';
import { TradeForm } from '@/components/forms/trade-form';
import { CsvImport } from '@/components/forms/csv-import';
import { createTrade, importTrades } from './actions';
import { Plus, FileUp } from 'lucide-react';
import type { ParsedTrade, ParsedDividend } from '@rivendell/core';

interface TradesPageClientProps {
  trades: any[];
  assets: { id: string; ticker: string }[];
}

export function TradesPageClient({ trades, assets }: TradesPageClientProps) {
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

  const handleImport = async (rows: (ParsedTrade | ParsedDividend)[]) => {
    return importTrades(rows);
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <Button size="sm" onClick={() => setShowTradeForm(true)}>
          <Plus className="h-4 w-4" /> Add Trade
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setShowCsvImport(true)}>
          <FileUp className="h-4 w-4" /> Import CSV
        </Button>
      </div>

      <TradesTable trades={trades} />

      {showTradeForm && (
        <TradeForm
          assets={assets}
          onSubmit={createTrade}
          onClose={() => setShowTradeForm(false)}
        />
      )}

      {showCsvImport && (
        <CsvImport
          onImport={handleImport}
          onClose={() => setShowCsvImport(false)}
        />
      )}
    </>
  );
}
