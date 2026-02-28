'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TradesTable } from '@/components/tables/trades-table';
import { TradeForm } from '@/components/forms/trade-form';
import { CsvImport } from '@/components/forms/csv-import';
import { createTrade, importTrades } from './actions';
import { Plus, FileUp, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import type { ParsedTrade, ParsedDividend } from '@rivendell/core';

interface TradesPageClientProps {
  trades: any[];
  assets: { id: string; ticker: string; currency?: string }[];
}

export function TradesPageClient({ trades, assets }: TradesPageClientProps) {
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

  const handleImport = async (rows: (ParsedTrade | ParsedDividend)[]) => {
    return importTrades(rows);
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Button onClick={() => setShowTradeForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Trade
        </Button>
        <Button variant="secondary" onClick={() => setShowCsvImport(true)}>
          <FileUp className="h-4 w-4 mr-1" /> Import CSV
        </Button>
        <Link href="/trades/import">
          <Button variant="secondary">
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Import Fineco XLSX
          </Button>
        </Link>
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
