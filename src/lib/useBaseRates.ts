"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clientApi } from "@/lib/axios/clientClient";
import { getOrgCurrency, minorUnits } from "@/lib/currency";
import type { ResolvedExchangeRate } from "@/lib/exchange-rates";

// Library items can be priced in a supplier's own currency. When such a price
// is prefilled into an itinerary (which is always in the vendor's base
// currency) it has to be converted. This loads the rate for every foreign
// currency in use (vendor's manual rate, else market) once, then converts
// synchronously: toBase(price, currency).
export function useBaseRates(currencies: (string | null | undefined)[]) {
  const base = getOrgCurrency();
  const wanted = useMemo(
    () => Array.from(new Set(currencies.filter((c): c is string => Boolean(c) && c !== base))).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currencies.join("|"), base],
  );
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    wanted.forEach((code) => {
      if (rates[code] != null) return;
      clientApi
        .get<ResolvedExchangeRate>(`/exchange-rates?from=${code}&to=${base}`)
        .then((res) => setRates((r) => ({ ...r, [code]: res.data.rate })))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, base]);

  return useCallback(
    (amount: number | null | undefined, currency: string | null | undefined): number | null => {
      if (amount == null) return null;
      if (!currency || currency === base) return amount;
      const rate = rates[currency];
      // Rate not loaded (or unavailable): leave the number as entered rather than guess.
      return rate == null ? amount : Number((amount * rate).toFixed(minorUnits(base)));
    },
    [rates, base],
  );
}
