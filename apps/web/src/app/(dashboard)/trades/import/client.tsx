'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PnlText } from '@/components/ui/pnl-text';
import { Upload, FileSpreadsheet, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { parseFinecoXlsx, type ParsedFinecoRow, type ParseResult } from '@/lib/fineco-xlsx-parser';
import { importFinecoRows } from './actions';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';

type Stage = 'upload' | 'preview' | 'importing' | 'done';

interface ImportSummary {
  tradesImported: number;
  dividendsImported: number;
  totalEurValue: number;
  errors: string[];
}

export function FinecoImportClient() {
  const [stage, setStage] = useState<Stage>('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const result = parseFinecoXlsx(buffer);
    setParseResult(result);
    // Select all rows by default
    setSelectedRows(new Set(result.rows.map((_, i) => i)));
    setStage('preview');
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const result = parseFinecoXlsx(buffer);
    setParseResult(result);
    setSelectedRows(new Set(result.rows.map((_, i) => i)));
    setStage('preview');
  }, []);

  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (!parseResult) return;
    if (selectedRows.size === parseResult.rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(parseResult.rows.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (!parseResult) return;

    const rowsToImport = parseResult.rows.filter((_, i) => selectedRows.has(i));
    setStage('importing');

    const result = await importFinecoRows(rowsToImport);
    setSummary(result);
    setStage('done');
  };

  const trades = parseResult?.rows.filter((r) => r.type === 'trade') ?? [];
  const dividends = parseResult?.rows.filter((r) => r.type === 'dividend') ?? [];
  const selectedCount = selectedRows.size;

  // Upload stage
  if (stage === 'upload') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <FileSpreadsheet className="h-16 w-16 text-muted" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Import Fineco Trades</h2>
          <p className="text-sm text-muted max-w-md">
            Upload your Fineco &quot;Lista Titoli&quot; XLSX export. Trades and dividends will be parsed automatically.
          </p>
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="w-full max-w-md rounded-xl border-2 border-dashed border-border hover:border-accent transition-colors p-12 text-center cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="h-8 w-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-text-primary font-medium">Drop XLSX file here or click to browse</p>
          <p className="text-xs text-muted mt-1">Supports .xlsx files from Fineco</p>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Preview stage
  if (stage === 'preview' && parseResult) {
    return (
      <div className="space-y-6">
        {/* Summary bar */}
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-text-primary">{fileName}</p>
              <p className="text-xs text-muted">
                {trades.length} trades, {dividends.length} dividends
                {parseResult.skipped > 0 && `, ${parseResult.skipped} rows skipped`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setStage('upload')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={handleImport} disabled={selectedCount === 0}>
              Import {selectedCount} rows
            </Button>
          </div>
        </Card>

        {/* Parse errors */}
        {parseResult.errors.length > 0 && (
          <Card className="border-warning/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning mb-1">Parse Warnings</p>
                {parseResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-muted">{err}</p>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Preview table */}
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === parseResult.rows.length}
                    onChange={toggleAll}
                    className="accent-positive"
                  />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>ISIN</TableHead>
                <TableHead>Side</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>CCY</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">FX Rate</TableHead>
                <TableHead className="text-right">EUR Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parseResult.rows.map((row, idx) => {
                const isSelected = selectedRows.has(idx);
                return (
                  <TableRow
                    key={idx}
                    className={isSelected ? '' : 'opacity-40'}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(idx)}
                        className="accent-positive"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.type === 'trade' ? 'default' : 'dividend'}>
                        {row.type === 'trade' ? 'Trade' : 'Dividend'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-sans text-sm">
                      {row.type === 'trade' ? row.tradeDate : row.flowDate}
                    </TableCell>
                    <TableCell className="font-sans text-sm text-text-primary font-medium max-w-[200px] truncate">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-text-secondary text-xs">{row.isin}</TableCell>
                    <TableCell>
                      {row.type === 'trade' && (
                        <Badge variant={row.side === 'BUY' ? 'buy' : 'sell'}>
                          {row.side}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(row.quantity, 0)}</TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell className="text-right">
                      {row.type === 'trade' ? formatNumber(row.price, 2) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-text-secondary">
                      {formatNumber(row.fxRate, 4)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.eurValue)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  // Importing stage
  if (stage === 'importing') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-lg text-text-primary font-medium">Importing trades...</p>
        <p className="text-sm text-muted">This may take a moment</p>
      </div>
    );
  }

  // Done stage
  if (stage === 'done' && summary) {
    const hasErrors = summary.errors.length > 0;
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 max-w-lg mx-auto">
        <div className={`rounded-full p-4 ${hasErrors ? 'bg-warning/10' : 'bg-positive/10'}`}>
          {hasErrors
            ? <AlertTriangle className="h-10 w-10 text-warning" />
            : <Check className="h-10 w-10 text-positive" />
          }
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-text-primary mb-2">
            {hasErrors ? 'Import completed with warnings' : 'Import complete'}
          </h2>
        </div>

        <Card className="w-full">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-muted mb-1">Trades</p>
              <p className="text-2xl font-mono font-bold text-text-primary">{summary.tradesImported}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">Dividends</p>
              <p className="text-2xl font-mono font-bold text-text-primary">{summary.dividendsImported}</p>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">Total Value</p>
              <p className="text-2xl font-mono font-bold text-positive">{formatCurrency(summary.totalEurValue)}</p>
            </div>
          </div>
        </Card>

        {hasErrors && (
          <Card className="w-full border-warning/50">
            <p className="text-sm font-medium text-warning mb-2">Errors ({summary.errors.length})</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {summary.errors.map((err, i) => (
                <p key={i} className="text-xs text-muted">{err}</p>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Link href="/trades">
            <Button>View Trades</Button>
          </Link>
          <Button variant="secondary" onClick={() => {
            setStage('upload');
            setParseResult(null);
            setSummary(null);
          }}>
            Import Another
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
