"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import { clientApi } from "@/lib/axios/clientClient";
import { formatMoney, getOrgCurrency } from "@/lib/currency";
import { formatRate, type ResolvedExchangeRate } from "@/lib/exchange-rates";
import type { SupportedCurrency } from "@/lib/currencies";

// Currency + rate for a payout to a supplier. The amount field next to it is
// entered in the chosen currency; the payout is stored in the vendor's base
// currency (what every total sums) alongside the original amount and rate.
export function SupplierCurrencyFields({
  currencyCode,
  exchangeRate,
  amount,
  onChange,
}: {
  /** "" = the vendor's base currency. */
  currencyCode: string;
  /** "" = today's rate. */
  exchangeRate: string;
  amount: string;
  onChange: (patch: { currencyCode?: string; exchangeRate?: string }) => void;
}) {
  const base = getOrgCurrency();
  const [currencies, setCurrencies] = useState<SupportedCurrency[]>([]);
  const [hint, setHint] = useState<ResolvedExchangeRate | null>(null);

  useEffect(() => {
    clientApi.get<SupportedCurrency[]>("/currencies").then((res) => setCurrencies(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setHint(null);
    if (!currencyCode || currencyCode === base) return;
    clientApi
      .get<ResolvedExchangeRate>(`/exchange-rates?from=${base}&to=${currencyCode}`)
      .then((res) => setHint(res.data))
      .catch(() => {});
  }, [currencyCode, base]);

  const foreign = currencyCode !== "" && currencyCode !== base;
  const rate = Number(exchangeRate) > 0 ? Number(exchangeRate) : hint?.rate;
  const amt = Number(amount);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Paid in"
          options={[
            { value: base, label: `${base} — vendor currency` },
            ...currencies.filter((c) => c.code !== base).map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
          ]}
          value={currencyCode || base}
          onChange={(e) => onChange({ currencyCode: e.target.value === base ? "" : e.target.value, exchangeRate: "" })}
        />
        {foreign && (
          <TextInput
            label={`Rate: 1 ${base} = ? ${currencyCode}`}
            type="number"
            min={0}
            step="any"
            placeholder={hint ? formatRate(hint.rate) : "Rate"}
            value={exchangeRate}
            onChange={(e) => onChange({ exchangeRate: e.target.value })}
          />
        )}
      </div>
      {foreign && rate && amt > 0 && (
        <p className="text-xs text-muted-foreground">
          Recorded as <span className="font-medium text-foreground">{formatMoney(amt / rate)}</span> in {base} (
          {formatMoney(amt, currencyCode)} at 1 {base} = {formatRate(rate)} {currencyCode}).
        </p>
      )}
    </div>
  );
}
