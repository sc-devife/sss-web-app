"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LuDownload } from "react-icons/lu";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Body } from "@/components/ui/Typography";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { formatDisplayDate } from "@/lib/date";
import { formatInr } from "@/lib/currency";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { getLeadPeriodRange, shiftLeadPeriodAnchor, type LeadPeriodRange, type LeadPeriodType } from "@/lib/lead-period";
import { salesReportQuery, type SalesReport, type SalesReportRow, type SalesReportType } from "@/lib/reports";

const TABS: { id: SalesReportType; label: string; firstColumn: string }[] = [
  { id: "sales-persons", label: "Sales Persons", firstColumn: "Sales Person" },
  { id: "escape-points", label: "Escape Point", firstColumn: "Escape Point" },
  { id: "lead-sources", label: "Lead Source", firstColumn: "Lead Source" },
];

function columnsFor(type: SalesReportType): DataTableColumn<SalesReportRow>[] {
  const first = TABS.find((t) => t.id === type)?.firstColumn ?? "Name";
  const columns: DataTableColumn<SalesReportRow>[] = [
    { key: "label", header: first, render: (r) => r.label, sortValue: (r) => r.label.toLowerCase() },
    { key: "leads", header: "Leads", render: (r) => r.leads, sortValue: (r) => r.leads },
    { key: "completed", header: "Completed", render: (r) => r.completed, sortValue: (r) => r.completed },
    { key: "hold", header: "Hold", render: (r) => r.hold, sortValue: (r) => r.hold },
    { key: "cancelled", header: "Cancelled", render: (r) => r.cancelled, sortValue: (r) => r.cancelled },
  ];
  if (type !== "sales-persons") {
    columns.push({
      key: "revenue",
      header: "Revenue",
      render: (r) => formatInr(r.revenue ?? 0),
      sortValue: (r) => r.revenue ?? 0,
    });
  }
  return columns;
}

// One tab's report. The rows always come from the backend for exactly the
// tab + period on screen (re-fetched whenever either changes), and Download
// requests that same tab + period from the backend again — it never exports
// whatever happens to be loaded in the table.
function ReportView({
  type,
  periodType,
  range,
  customFrom,
  customTo,
  onPeriodTypeChange,
  onStep,
  onCustomRange,
}: {
  type: SalesReportType;
  periodType: LeadPeriodType;
  /** The range actually in effect — the custom "Dates between" range if set, otherwise the Month/Week/Day/All period. */
  range: LeadPeriodRange;
  customFrom: string;
  customTo: string;
  onPeriodTypeChange: (next: LeadPeriodType) => void;
  onStep: (direction: 1 | -1) => void;
  onCustomRange: (from: string, to: string) => void;
}) {
  const customActive = Boolean(customFrom || customTo);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    clientApi
      .get<SalesReport>(`/reports/sales?${salesReportQuery(type, range.from, range.to)}`)
      .then((res) => {
        if (!cancelled) setReport(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setReport(null);
          setError(extractErrorMessage(err, "Failed to load report"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, range.from, range.to]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await clientApi.get<Blob>(`/reports/sales/export?${salesReportQuery(type, range.from, range.to)}`, {
        responseType: "blob",
      });
      const disposition = res.headers["content-disposition"] as string | undefined;
      const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? `sales-report-${type}.csv`;
      const objectUrl = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to download report"));
    } finally {
      setDownloading(false);
    }
  }

  if (error) {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <DataTable
      columns={columnsFor(type)}
      rows={report?.rows ?? []}
      rowKey={(r) => r.label}
      emptyMessage="No leads in this period."
      loading={loading}
      toolbarExtra={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PeriodFilter
              type={periodType}
              label={range.label}
              onTypeChange={onPeriodTypeChange}
              onStep={onStep}
              stepDisabled={customActive}
            />
            <DateRangeFilter from={customFrom} to={customTo} onApply={onCustomRange} />
          </div>
          <Button size="sm" variant="secondary" onClick={handleDownload} loading={downloading} loadingText="Downloading…">
            <LuDownload size={14} />
            Download
          </Button>
        </div>
      }
    />
  );
}

export function SalesReportsPanel() {
  // Month by default ("All" = no date bounds); the period is shared across the three tabs so switching
  // tab keeps the same window. Changing the period type resets the anchor to
  // today (same behavior as the Leads page's filter).
  const [periodType, setPeriodType] = useState<LeadPeriodType>("month");
  const [periodAnchor, setPeriodAnchor] = useState<Date>(() => new Date());

  // Dates between ("YYYY-MM-DD" or ""): when either end is set it overrides the
  // Month/Week/Day/All period for every tab, like the Leads page's More
  // Filters. Picking a period type again hands control back to the period.
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const periodRange = getLeadPeriodRange(periodType, periodAnchor);
  const range: LeadPeriodRange =
    customFrom || customTo
      ? {
          from: customFrom || null,
          to: customTo || null,
          label: customFrom && customTo
            ? `${formatDisplayDate(customFrom)} – ${formatDisplayDate(customTo)}`
            : customFrom
              ? `From ${formatDisplayDate(customFrom)}`
              : `Until ${formatDisplayDate(customTo)}`,
        }
      : periodRange;

  return (
    <Tabs tabs={TABS.map(({ id, label }) => ({ id, label }))} defaultTab="sales-persons" bare>
      {(activeTab) => (
        <ReportView
          key={activeTab}
          type={activeTab as SalesReportType}
          periodType={periodType}
          range={range}
          customFrom={customFrom}
          customTo={customTo}
          onPeriodTypeChange={(next) => {
            setPeriodType(next);
            setPeriodAnchor(new Date());
            setCustomFrom("");
            setCustomTo("");
          }}
          onStep={(direction) => setPeriodAnchor((a) => shiftLeadPeriodAnchor(periodType, a, direction))}
          onCustomRange={(from, to) => {
            setCustomFrom(from);
            setCustomTo(to);
          }}
        />
      )}
    </Tabs>
  );
}
