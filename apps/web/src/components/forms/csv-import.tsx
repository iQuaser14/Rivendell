'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CsvImportPreview } from './csv-import-preview';
import { X, Upload } from 'lucide-react';
import { parseFinecoCSV, isParsedTrade, isParsedDividend } from '@rivendell/core';
import type { ParsedTrade, ParsedDividend, ParseError } from '@rivendell/core';

interface CsvImportProps {
  onImport: (rows: (ParsedTrade | ParsedDividend)[]) => Promise<{ error?: string }>;
  onClose: () => void;
}

export function CsvImport({ onImport, onClose }: CsvImportProps) {
  const [rows, setRows] = useState<(ParsedTrade | ParsedDividend)[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseFinecoCSV(text);
      if (result.ok) {
        const parsed = result.value.filter(
          (r): r is ParsedTrade | ParsedDividend => isParsedTrade(r) || isParsedDividend(r),
        );
        setRows(parsed);
        setSelected(new Set(parsed.map((_, i) => i)));
        setParseErrors([]);
      } else {
        setParseErrors(result.error);
        setRows([]);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleRow = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((_, i) => i)));
  };

  const handleImport = async () => {
    const selectedRows = rows.filter((_, i) => selected.has(i));
    if (selectedRows.length === 0) return;
    setImporting(true);
    setError(null);
    const res = await onImport(selectedRows);
    setImporting(false);
    if (res?.error) setError(res.error);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <Card className="max-h-[90vh] w-full sm:max-w-4xl overflow-hidden rounded-b-none sm:rounded-b-xl">
        <CardHeader>
          <CardTitle>Import Fineco CSV</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        {rows.length === 0 ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center transition-colors hover:border-accent"
          >
            <Upload className="mb-3 h-10 w-10 text-muted" />
            <p className="text-sm text-text-secondary">
              Drag & drop your Fineco CSV file here
            </p>
            <p className="mt-1 text-xs text-muted">or</p>
            <label className="mt-2 cursor-pointer">
              <span className="text-sm font-medium text-accent hover:text-accent-hover">
                Browse files
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            </label>
            {parseErrors.length > 0 && (
              <div className="mt-4 max-w-md text-left">
                <p className="text-sm font-medium text-negative">Parse errors:</p>
                {parseErrors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-negative/80">
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                {fileName} — {rows.length} rows parsed, {selected.size} selected
              </p>
            </div>
            <div className="max-h-[50vh] overflow-auto">
              <CsvImportPreview
                rows={rows}
                selected={selected}
                onToggle={toggleRow}
                onToggleAll={toggleAll}
              />
            </div>
            {error && <p className="mt-2 text-sm text-negative">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setRows([]); setSelected(new Set()); }}>
                Reset
              </Button>
              <Button onClick={handleImport} disabled={importing || selected.size === 0}>
                {importing ? 'Importing...' : `Import ${selected.size} rows`}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
