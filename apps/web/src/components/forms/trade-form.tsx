'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PnlText } from '@/components/ui/pnl-text';
import { X, Search, Loader2, AlertTriangle } from 'lucide-react';
import { tradeInputSchema, CURRENCIES, TradeSide } from '@rivendell/core';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Decimal from 'decimal.js';
import type { SearchResult } from '@/app/api/quotes/search/route';
import type { YahooQuote } from '@/app/api/quotes/route';

interface TradeFormProps {
  assets: { id: string; ticker: string; currency?: string }[];
  onSubmit: (data: FormData) => Promise<{ error?: string }>;
  onClose: () => void;
  /** Pre-fill for quick sell from positions */
  prefill?: {
    ticker?: string;
    assetId?: string;
    side?: string;
    quantity?: number;
    price?: number;
    currency?: string;
    fxRate?: number;
  };
}

export function TradeForm({ assets, onSubmit, onClose, prefill }: TradeFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Ticker search state
  const [tickerQuery, setTickerQuery] = useState(prefill?.ticker ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(prefill?.assetId ?? '');
  const [selectedTicker, setSelectedTicker] = useState(prefill?.ticker ?? '');
  const [selectedCurrency, setSelectedCurrency] = useState(prefill?.currency ?? 'EUR');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Price/FX auto-fetch state
  const [price, setPrice] = useState(prefill?.price?.toString() ?? '');
  const [fxRate, setFxRate] = useState(prefill?.fxRate?.toString() ?? '1');
  const [useLivePrice, setUseLivePrice] = useState(!prefill?.price);
  const [useLiveFx, setUseLiveFx] = useState(!prefill?.fxRate);

  // Form fields
  const [side, setSide] = useState(prefill?.side ?? 'BUY');
  const [quantity, setQuantity] = useState(prefill?.quantity?.toString() ?? '');
  const [commission, setCommission] = useState('0');
  const [tax, setTax] = useState('0');

  // Ticker search query
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['ticker-search', tickerQuery],
    queryFn: async () => {
      if (tickerQuery.length < 1) return [];
      const res = await fetch(`/api/quotes/search?q=${encodeURIComponent(tickerQuery)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.results as SearchResult[];
    },
    enabled: tickerQuery.length >= 1 && showDropdown,
    staleTime: 60_000,
  });

  // Auto-fetch live quote when ticker is selected
  const { data: liveQuote } = useQuery({
    queryKey: ['quote', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(selectedTicker)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return (data.quotes?.[0] as YahooQuote) ?? null;
    },
    enabled: !!selectedTicker,
    staleTime: 15_000,
  });

  // Auto-fetch FX rate for non-EUR currencies
  const { data: fxQuote } = useQuery({
    queryKey: ['fx-quote', selectedCurrency],
    queryFn: async () => {
      if (selectedCurrency === 'EUR') return null;
      // Fetch EUR/XXX pair from Yahoo (e.g. EURUSD=X)
      const pair = `EUR${selectedCurrency}=X`;
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(pair)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return (data.quotes?.[0] as YahooQuote) ?? null;
    },
    enabled: selectedCurrency !== 'EUR',
    staleTime: 30_000,
  });

  // Update price when live quote arrives
  useEffect(() => {
    if (liveQuote && useLivePrice) {
      setPrice(liveQuote.regularMarketPrice.toString());
    }
  }, [liveQuote, useLivePrice]);

  // Update FX rate when FX quote arrives
  useEffect(() => {
    if (fxQuote && useLiveFx) {
      setFxRate(fxQuote.regularMarketPrice.toString());
    }
  }, [fxQuote, useLiveFx]);

  // When currency is EUR, set FX to 1
  useEffect(() => {
    if (selectedCurrency === 'EUR') {
      setFxRate('1');
    }
  }, [selectedCurrency]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Select a ticker from search results
  const selectTicker = useCallback((result: SearchResult) => {
    // Check if this ticker already exists in our assets
    const existing = assets.find(
      (a) => a.ticker.toLowerCase() === result.symbol.toLowerCase(),
    );

    setSelectedTicker(result.symbol);
    setSelectedAssetId(existing?.id ?? '');
    setTickerQuery(result.symbol);
    setShowDropdown(false);

    // Set currency from search result
    if (result.currency) {
      const ccy = result.currency.toUpperCase();
      // GBp → GBP (Yahoo returns pence as GBp)
      const normalized = ccy === 'GBP' || ccy === 'GBX' ? 'GBP' : ccy;
      if (CURRENCIES.includes(normalized as any)) {
        setSelectedCurrency(normalized);
      }
    }

    // Re-enable live price fetch
    setUseLivePrice(true);
    setUseLiveFx(true);
  }, [assets]);

  // Select from existing assets dropdown
  const selectExistingAsset = useCallback((assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      setSelectedAssetId(asset.id);
      setSelectedTicker(asset.ticker);
      setTickerQuery(asset.ticker);
      if (asset.currency && CURRENCIES.includes(asset.currency as any)) {
        setSelectedCurrency(asset.currency);
      }
      setUseLivePrice(true);
      setUseLiveFx(true);
    }
  }, [assets]);

  // Compute preview
  const qty = parseFloat(quantity) || 0;
  const prc = parseFloat(price) || 0;
  const fx = parseFloat(fxRate) || 1;
  const comm = parseFloat(commission) || 0;
  const txVal = parseFloat(tax) || 0;

  const grossLocal = qty * prc;
  const grossEur = fx > 0 ? grossLocal / fx : 0;
  const commEur = fx > 0 ? comm / fx : 0;
  const taxEur = fx > 0 ? txVal / fx : 0;

  const isBuyOrCover = side === 'BUY' || side === 'COVER';
  const netLocal = isBuyOrCover ? grossLocal + comm + txVal : grossLocal - comm - txVal;
  const netEur = isBuyOrCover ? grossEur + commEur + taxEur : grossEur - commEur - taxEur;

  const showPreview = qty > 0 && prc > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Build form data
    const formData = new FormData();
    formData.set('assetId', selectedAssetId);
    formData.set('ticker', selectedTicker);
    formData.set('tradeDate', (e.currentTarget.elements.namedItem('tradeDate') as HTMLInputElement).value);
    formData.set('side', side);
    formData.set('quantity', quantity);
    formData.set('price', price);
    formData.set('currency', selectedCurrency);
    formData.set('fxRateToEur', fxRate);
    formData.set('commission', commission);
    formData.set('tax', tax);
    formData.set('notes', (e.currentTarget.elements.namedItem('notes') as HTMLInputElement)?.value ?? '');
    formData.set('tradeGroup', (e.currentTarget.elements.namedItem('tradeGroup') as HTMLInputElement)?.value ?? '');

    // Client-side Zod validation
    const raw = {
      assetId: selectedAssetId || '00000000-0000-0000-0000-000000000000', // placeholder for new assets
      tradeDate: formData.get('tradeDate'),
      side,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      currency: selectedCurrency,
      fxRateToEur: parseFloat(fxRate),
      commission: parseFloat(commission) || 0,
      tax: parseFloat(tax) || 0,
      notes: formData.get('notes') || undefined,
      tradeGroup: formData.get('tradeGroup') || undefined,
    };

    // Skip assetId validation if it's a new asset (will be created server-side)
    if (!selectedAssetId && !selectedTicker) {
      setErrors({ ticker: 'Please select a ticker' });
      return;
    }

    const result = selectedAssetId
      ? tradeInputSchema.safeParse(raw)
      : tradeInputSchema.omit({ assetId: true }).safeParse(raw);

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
    const res = await onSubmit(formData);
    setSubmitting(false);
    if (res?.error) {
      setErrors({ form: res.error });
    } else {
      onClose();
    }
  }

  // Combine existing assets with search results for the dropdown
  const filteredAssets = tickerQuery.length > 0
    ? assets.filter((a) => a.ticker.toLowerCase().includes(tickerQuery.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <Card className="w-full max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-b-none sm:rounded-b-xl">
        <CardHeader>
          <CardTitle>Add Trade</CardTitle>
          <button onClick={onClose} className="text-muted hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Side selector */}
          <div>
            <label className="mb-1 block text-xs text-muted">Side</label>
            <div className="grid grid-cols-4 gap-1">
              {Object.values(TradeSide).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    side === s
                      ? s === 'BUY' || s === 'COVER'
                        ? 'bg-positive text-background'
                        : 'bg-negative text-white'
                      : 'bg-surface text-text-secondary hover:bg-border'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Ticker search */}
          <div ref={dropdownRef} className="relative">
            <label className="mb-1 block text-xs text-muted">Ticker</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={tickerQuery}
                onChange={(e) => {
                  setTickerQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) {
                    setSelectedTicker('');
                    setSelectedAssetId('');
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search ticker (e.g. AAPL, SHEL.L)..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 pl-9 text-sm text-text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-positive"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted animate-spin" />
              )}
            </div>

            {/* Selected ticker info */}
            {selectedTicker && liveQuote && (
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-text-primary font-medium">{liveQuote.shortName}</span>
                <span className="text-muted">|</span>
                <span className="text-text-secondary">{liveQuote.exchange}</span>
                <span className="text-muted">|</span>
                <span className="text-text-secondary">{liveQuote.currency}</span>
              </div>
            )}

            {/* Dropdown */}
            {showDropdown && tickerQuery.length >= 1 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                {/* Existing assets */}
                {filteredAssets.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted bg-surface">
                      Your Assets
                    </div>
                    {filteredAssets.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => selectExistingAsset(a.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center justify-between"
                      >
                        <span className="font-medium text-text-primary">{a.ticker}</span>
                        {a.currency && <span className="text-xs text-muted">{a.currency}</span>}
                      </button>
                    ))}
                  </>
                )}

                {/* Yahoo search results */}
                {searchResults && searchResults.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted bg-surface">
                      Yahoo Finance
                    </div>
                    {searchResults.map((r) => (
                      <button
                        key={r.symbol}
                        type="button"
                        onClick={() => selectTicker(r)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-text-primary">{r.symbol}</span>
                          <span className="ml-2 text-xs text-text-secondary">{r.shortName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span>{r.exchange}</span>
                          <span>{r.quoteType}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {!searchLoading && filteredAssets.length === 0 && (!searchResults || searchResults.length === 0) && (
                  <div className="px-3 py-4 text-center text-xs text-muted">No results found</div>
                )}
              </div>
            )}
            {errors.ticker && <p className="mt-1 text-xs text-negative">{errors.ticker}</p>}
            {errors.assetId && <p className="mt-1 text-xs text-negative">{errors.assetId}</p>}
          </div>

          {/* Date + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Date</label>
              <Input
                type="date"
                name="tradeDate"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
              {errors.tradeDate && <p className="mt-1 text-xs text-negative">{errors.tradeDate}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="any"
                min="0.000001"
                required
              />
              {errors.quantity && <p className="mt-1 text-xs text-negative">{errors.quantity}</p>}
            </div>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted">
                Price ({selectedCurrency})
              </label>
              {liveQuote && (
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setUseLivePrice(true);
                      setPrice(liveQuote.regularMarketPrice.toString());
                    }}
                    className={`${useLivePrice ? 'text-positive' : 'text-muted hover:text-text-primary'}`}
                  >
                    Live: {formatNumber(liveQuote.regularMarketPrice, 2)}
                  </button>
                  <span className="text-muted">|</span>
                  <span className="text-muted">
                    Prev: {formatNumber(liveQuote.regularMarketPreviousClose, 2)}
                  </span>
                </div>
              )}
            </div>
            <Input
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setUseLivePrice(false);
              }}
              step="any"
              min="0.000001"
              required
            />
            {errors.price && <p className="mt-1 text-xs text-negative">{errors.price}</p>}
          </div>

          {/* Currency + FX Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Currency</label>
              <Select
                value={selectedCurrency}
                onChange={(e) => {
                  setSelectedCurrency(e.target.value);
                  setUseLiveFx(true);
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted">FX Rate (1 EUR = X)</label>
                {fxQuote && selectedCurrency !== 'EUR' && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseLiveFx(true);
                      setFxRate(fxQuote.regularMarketPrice.toString());
                    }}
                    className={`text-[10px] ${useLiveFx ? 'text-positive' : 'text-muted hover:text-text-primary'}`}
                  >
                    Live: {formatNumber(fxQuote.regularMarketPrice, 4)}
                  </button>
                )}
              </div>
              <Input
                type="number"
                value={fxRate}
                onChange={(e) => {
                  setFxRate(e.target.value);
                  setUseLiveFx(false);
                }}
                step="any"
                min="0.000001"
                required
                disabled={selectedCurrency === 'EUR'}
              />
              {errors.fxRateToEur && <p className="mt-1 text-xs text-negative">{errors.fxRateToEur}</p>}
            </div>
          </div>

          {/* Commission + Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Commission</label>
              <Input
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                step="any"
                min="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Tax</label>
              <Input
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                step="any"
                min="0"
              />
            </div>
          </div>

          {/* Notes + Trade Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Notes</label>
              <Input name="notes" placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Trade Group</label>
              <Input name="tradeGroup" placeholder="Optional" />
            </div>
          </div>

          {/* Cash Impact Preview */}
          {showPreview && (
            <div className="rounded-lg border border-border bg-surface p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Preview</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-text-secondary">Gross ({selectedCurrency})</span>
                <span className="text-right font-mono text-text-primary">
                  {formatNumber(grossLocal, 2)}
                </span>

                <span className="text-text-secondary">Gross (EUR)</span>
                <span className="text-right font-mono text-text-primary">
                  {formatCurrency(grossEur)}
                </span>

                {(comm > 0 || txVal > 0) && (
                  <>
                    <span className="text-text-secondary">Commission + Tax</span>
                    <span className="text-right font-mono text-text-primary">
                      {formatNumber(comm + txVal, 2)} {selectedCurrency}
                    </span>
                  </>
                )}

                <span className="text-text-secondary font-medium">
                  Net {isBuyOrCover ? 'cost' : 'proceeds'} (EUR)
                </span>
                <PnlText
                  value={isBuyOrCover ? -netEur : netEur}
                  className="text-right"
                />
              </div>

              {/* Cash warning */}
              {isBuyOrCover && netLocal > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded border border-warning/30 bg-warning/5 p-2">
                  <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warning">
                    This trade will debit {formatNumber(netLocal, 2)} {selectedCurrency} from your cash account.
                    Verify sufficient balance before executing.
                  </p>
                </div>
              )}
            </div>
          )}

          {errors.form && (
            <p className="text-sm text-negative">{errors.form}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : `${side} ${selectedTicker || 'Trade'}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
