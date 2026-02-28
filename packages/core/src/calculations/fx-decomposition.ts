import Decimal from 'decimal.js';
import type { FxDecomposition } from '../models/types.js';
import { d, safeDivide } from '../utils/math.js';

/**
 * Decompose a position's EUR return into local, FX, and cross-term components.
 *
 * Local Return:  R_local = (P_end - P_begin) / P_begin
 * FX Impact:     R_fx = (FX_begin / FX_end) - 1
 *   (ECB convention: 1 EUR = X foreign, so EUR strengthening = rate goes up = negative FX impact)
 * Total EUR:     R_total = (1 + R_local) × (1 + R_fx) - 1
 * Cross-term:    R_cross = R_total - R_local - R_fx
 *
 * @param entryPriceLocal - purchase price in local currency
 * @param currentPriceLocal - current price in local currency
 * @param entryFxRate - EUR/XXX rate at entry (1 EUR = X foreign)
 * @param currentFxRate - EUR/XXX rate now (1 EUR = X foreign)
 */
export function decomposeFxReturn(
  entryPriceLocal: Decimal,
  currentPriceLocal: Decimal,
  entryFxRate: Decimal,
  currentFxRate: Decimal,
): FxDecomposition {
  // Local currency return
  const localReturn = safeDivide(
    currentPriceLocal.minus(entryPriceLocal),
    entryPriceLocal,
  );

  // FX impact: if EUR strengthens (rate goes up), we lose in EUR terms
  // R_fx = (entryFxRate / currentFxRate) - 1
  const fxImpact = safeDivide(entryFxRate, currentFxRate).minus(1);

  // Total return in EUR
  const totalReturnEur = d(1)
    .plus(localReturn)
    .mul(d(1).plus(fxImpact))
    .minus(1);

  // Cross-term (interaction)
  const crossTerm = totalReturnEur.minus(localReturn).minus(fxImpact);

  return {
    localReturn,
    fxImpact,
    crossTerm,
    totalReturnEur,
  };
}
