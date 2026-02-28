# Rivendell — Personal Wealth Management App

## What This Is
Institutional-grade personal portfolio tracker for a hedge fund PM.
Single user, single cash account, multi-currency (EUR base), full attribution.

## Tech
Turborepo monorepo: apps/web (Next.js 14), apps/mobile (Expo), packages/core, packages/supabase.

## Critical Rules
- ALL monetary values: DECIMAL, never float. Use decimal.js in TypeScript.
- Base currency: EUR. All portfolio-level values in EUR.
- Trading currencies: USD, CHF, AUD, GBP, JPY, SEK, DKK, NOK (and EUR).
- FX rates: 1 EUR = X foreign currency (ECB convention).
- TWR: Modified Dietz method. Compound daily returns for longer periods.
- Cash auto-updates via PostgreSQL triggers on trades and cash_flows inserts.
- Every position P&L must decompose into: local return + FX impact + cross-term.
- Brinson attribution runs at sector AND region level vs MSCI World EUR.
- Short positions: quantity is negative in positions table.
- Dates: date-fns, store as UTC DATE or TIMESTAMPTZ.
- Validation: Zod on all external data (CSV, API).
- Error handling: Result<T, E> pattern, no thrown exceptions in business logic.
- All calculation functions must have unit tests with known examples.
- Italian tax: 26% capital gains on realized gains.

## Fineco CSV Format
- Date: DD/MM/YYYY
- Decimal separator: comma (1.234,56)
- Operations: "Acquisto" (buy), "Vendita" (sell), "Dividendo" (dividend)
- Currency field: "EUR", "USD", "CHF"
- ISIN provided for each security

## Commands
- `npm run build` — build all packages
- `npm run test` — run all tests
- `npm run typecheck` — TypeScript type checking
- `npx turbo build --filter=@rivendell/core` — build core package only
- `npx vitest run` — run tests in a package directory
