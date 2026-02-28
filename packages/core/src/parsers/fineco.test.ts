import { describe, it, expect } from 'vitest';
import { parseFinecoCSV, isParsedTrade, isParsedDividend } from './fineco.js';

describe('parseFinecoCSV', () => {
  it('parses buy trades correctly', () => {
    const csv = [
      'Date;Operation;Ticker;ISIN;Currency;Quantity;Price;Amount;Commission',
      '15/03/2024;Acquisto;SHEL;GB00BP6MXD84;GBP;100;28,50;2.850,00;9,95',
    ].join('\n');

    const result = parseFinecoCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(1);
    const trade = result.value[0];
    expect(isParsedTrade(trade)).toBe(true);
    if (!isParsedTrade(trade)) return;

    expect(trade.side).toBe('BUY');
    expect(trade.ticker).toBe('SHEL');
    expect(trade.isin).toBe('GB00BP6MXD84');
    expect(trade.currency).toBe('GBP');
    expect(trade.quantity).toBe(100);
    expect(trade.price).toBe(28.5);
    expect(trade.amount).toBe(2850);
    expect(trade.commission).toBe(9.95);
  });

  it('parses sell trades correctly', () => {
    const csv = [
      'Date;Operation;Ticker;ISIN;Currency;Quantity;Price;Amount;Commission',
      '20/03/2024;Vendita;AAPL;US0378331005;USD;50;172,30;8.615,00;12,95',
    ].join('\n');

    const result = parseFinecoCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const trade = result.value[0];
    expect(isParsedTrade(trade)).toBe(true);
    if (!isParsedTrade(trade)) return;
    expect(trade.side).toBe('SELL');
    expect(trade.quantity).toBe(50);
    expect(trade.price).toBe(172.3);
  });

  it('parses dividends correctly', () => {
    const csv = [
      'Date;Operation;Ticker;ISIN;Currency;Quantity;Price;Amount;Commission',
      '01/06/2024;Dividendo;SHEL;GB00BP6MXD84;GBP;0;0;125,50;',
    ].join('\n');

    const result = parseFinecoCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const dividend = result.value[0];
    expect(isParsedDividend(dividend)).toBe(true);
    if (!isParsedDividend(dividend)) return;
    expect(dividend.flowType).toBe('dividend');
    expect(dividend.amount).toBe(125.5);
    expect(dividend.currency).toBe('GBP');
  });

  it('handles comma decimal separators', () => {
    const csv = [
      'Date;Operation;Ticker;ISIN;Currency;Quantity;Price;Amount;Commission',
      '10/01/2024;Acquisto;NESN;CH0038863350;CHF;25;105,60;2.640,00;14,95',
    ].join('\n');

    const result = parseFinecoCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const trade = result.value[0];
    expect(isParsedTrade(trade)).toBe(true);
    if (!isParsedTrade(trade)) return;
    expect(trade.price).toBe(105.6);
    expect(trade.amount).toBe(2640);
    expect(trade.commission).toBe(14.95);
  });

  it('returns error for empty CSV', () => {
    const result = parseFinecoCSV('');
    expect(result.ok).toBe(false);
  });

  it('returns errors for invalid rows but still parses valid ones', () => {
    const csv = [
      'Date;Operation;Ticker;ISIN;Currency;Quantity;Price;Amount;Commission',
      '15/03/2024;Acquisto;SHEL;GB00BP6MXD84;GBP;100;28,50;2.850,00;9,95',
      'bad-date;Unknown;XXX;ISIN;ZZZ;abc;def;ghi;jkl',
    ].join('\n');

    const result = parseFinecoCSV(csv);
    // Should succeed with partial results since at least one row is valid
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
  });

  it('parses multiple rows', () => {
    const csv = [
      'Date;Operation;Ticker;ISIN;Currency;Quantity;Price;Amount;Commission',
      '15/03/2024;Acquisto;SHEL;GB00BP6MXD84;GBP;100;28,50;2.850,00;9,95',
      '16/03/2024;Acquisto;CCJ;US13321L1089;USD;200;45,20;9.040,00;12,95',
      '17/03/2024;Vendita;AAPL;US0378331005;USD;50;172,30;8.615,00;12,95',
    ].join('\n');

    const result = parseFinecoCSV(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(3);
  });
});
