"use client";

import { useEffect, useState } from "react";
import { IoRefresh } from "react-icons/io5";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Body } from "@/components/ui/Typography";
import { Switch } from "@/components/ui/Switch";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { formatDisplayDate } from "@/lib/date";
import { formatRate, type OrgExchangeRateRow } from "@/lib/exchange-rates";
import { useAppSelector } from "@/store/hooks";
import { selectOrganization } from "@/features/organization/organizationSelectors";

// The vendor's rate table: their base currency against every other currency.
// Rates read "1 <base> = ? <currency>" (vendor currency first). The market
// rate refreshes daily; typing a rate here and switching Manual on pins it —
// the daily refresh never touches a manual rate. Switch Manual off (or use
// "Use market") to follow the market again.
function RateInput({
  row,
  base,
  onCommit,
  disabled,
}: {
  row: OrgExchangeRateRow;
  base: string;
  onCommit: (rate: number) => void;
  disabled: boolean;
}) {
  const shown = row.manualRate ?? row.marketRate;
  const [value, setValue] = useState(shown != null ? formatRate(shown) : "");

  useEffect(() => {
    setValue(shown != null ? formatRate(shown) : "");
  }, [shown]);

  function commit() {
    const n = Number(value);
    if (!value || Number.isNaN(n) || n <= 0) {
      setValue(shown != null ? formatRate(shown) : "");
      return;
    }
    if (shown == null || Math.abs(n - shown) > 1e-12) onCommit(n);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="whitespace-nowrap text-xs text-muted-foreground">1 {base} =</span>
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        disabled={disabled}
        aria-label={`Your rate for ${row.currencyCode}`}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 w-28 rounded border border-border bg-card px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      />
      <span className="text-xs text-muted-foreground">{row.currencyCode}</span>
    </div>
  );
}

export function ExchangeRatesPanel() {
  const organization = useAppSelector(selectOrganization);
  const base = organization?.settings?.default_currency_code ?? "INR";

  const [rows, setRows] = useState<OrgExchangeRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const res = await clientApi.get<OrgExchangeRateRow[]>("/exchange-rates/org");
      setRows(res.data);
      setError(undefined);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load exchange rates"));
    } finally {
      setLoading(false);
    }
  }

  // Reloads when the base currency changes (the table is always base vs the rest).
  useEffect(() => {
    load();
  }, [base]);

  function replaceRow(next: OrgExchangeRateRow) {
    setRows((prev) => prev.map((r) => (r.currencyCode === next.currencyCode ? next : r)));
  }

  async function save(code: string, rate: number, manual: boolean) {
    setBusyCode(code);
    try {
      const res = await clientApi.put<OrgExchangeRateRow>(`/exchange-rates/org/${code}`, { rate, manual });
      replaceRow(res.data);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to save rate"));
    } finally {
      setBusyCode(null);
    }
  }

  async function resetToMarket(code: string) {
    setBusyCode(code);
    try {
      const res = await clientApi.delete<OrgExchangeRateRow>(`/exchange-rates/org/${code}`);
      replaceRow(res.data);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to reset rate"));
    } finally {
      setBusyCode(null);
    }
  }

  async function refreshMarket() {
    setRefreshing(true);
    try {
      const res = await clientApi.post<{ stored: number }>("/exchange-rates/refresh");
      if (res.data.stored === 0) toast.error("Couldn't reach the rate provider — keeping the last known rates.");
      else toast.success("Market rates updated.");
      await load();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to refresh rates"));
    } finally {
      setRefreshing(false);
    }
  }

  if (error) return <Body className="text-danger">{error}</Body>;

  const asOf = rows.find((r) => r.asOf)?.asOf ?? null;

  const columns: DataTableColumn<OrgExchangeRateRow>[] = [
    {
      key: "currency",
      header: "Currency",
      render: (r) => (
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{r.currencyCode}</span>
          <span className="text-xs text-muted-foreground">{r.currencyName}</span>
        </span>
      ),
      sortValue: (r) => r.currencyCode,
      filterValue: (r) => `${r.currencyCode} ${r.currencyName}`,
    },
    {
      key: "market",
      header: "Market rate",
      render: (r) => (r.marketRate != null ? `1 ${base} = ${formatRate(r.marketRate)} ${r.currencyCode}` : "Not available yet"),
      sortValue: (r) => r.marketRate ?? -1,
    },
    {
      key: "yours",
      header: "Your rate",
      render: (r) => (
        <RateInput
          row={r}
          base={base}
          disabled={busyCode === r.currencyCode}
          onCommit={(rate) => save(r.currencyCode, rate, true)}
        />
      ),
    },
    {
      key: "manual",
      header: "Manual",
      render: (r) => (
        <Switch
          checked={r.manual}
          disabled={busyCode === r.currencyCode || (r.manualRate == null && r.marketRate == null)}
          onLabel="ON"
          offLabel="OFF"
          ariaLabel={`Use a manual rate for ${r.currencyCode}`}
          title={r.manual ? "Fixed at your rate — never refreshed from the market" : "Follows the market rate"}
          onChange={(next) => save(r.currencyCode, r.manualRate ?? r.marketRate ?? 0, next)}
        />
      ),
      sortValue: (r) => (r.manual ? 1 : 0),
    },
    {
      key: "effective",
      header: "In use",
      render: (r) => (
        <span className="text-sm font-semibold text-foreground">
          {r.effectiveRate != null ? formatRate(r.effectiveRate) : "—"}
        </span>
      ),
      sortValue: (r) => r.effectiveRate ?? -1,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.currencyCode}
      loading={loading}
      pageSize={8}
      searchPlaceholder="Search currency…"
      emptyMessage="No other currencies available."
      actions={(r) =>
        r.manualRate != null ? (
          <button
            type="button"
            disabled={busyCode === r.currencyCode}
            onClick={() => resetToMarket(r.currencyCode)}
            title="Discard your rate and use the market rate"
            className="rounded-full px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            Use market
          </button>
        ) : null
      }
      toolbarExtra={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Rates read “1 {base} = ? currency”. Market rates{asOf ? ` as of ${formatDisplayDate(asOf)}` : ""}, refreshed daily.
          </span>
          <Button size="sm" variant="secondary" onClick={refreshMarket} loading={refreshing} loadingText="Refreshing…">
            <IoRefresh size={14} />
            Refresh market rates
          </Button>
        </div>
      }
    />
  );
}
