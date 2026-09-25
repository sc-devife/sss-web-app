"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import { clientApi } from "@/lib/axios/clientClient";
import { getOrgCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currencies";

// "Prices in": the currency a supplier's prices are quoted in. Blank = the
// vendor's base currency. They're converted to base when priced into an itinerary.
export function PriceCurrencySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const base = getOrgCurrency();
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);

  useEffect(() => {
    clientApi.get<SupportedCurrency[]>("/currencies").then((res) => setCurrencies(res.data)).catch(() => {});
  }, []);

  return (
    <Select
      label="Prices in"
      options={[
        { value: base, label: `${base} — vendor currency` },
        ...currencies.filter((c) => c.code !== base).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
      ]}
      value={value || base}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
