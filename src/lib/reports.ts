// Mirrors SalesReportResponseDTO / SalesReportRowDTO — see the Sales reports
// in ReportServiceImpl for how each figure is defined.

export type SalesReportType = "sales-persons" | "escape-points" | "lead-sources";

export interface SalesReportRow {
  label: string;
  leads: number;
  completed: number;
  hold: number;
  cancelled: number;
  /** Null for the Sales Persons report, which has no Revenue column. */
  revenue: number | null;
}

export interface SalesReport {
  type: SalesReportType;
  from: string | null;
  to: string | null;
  hasRevenue: boolean;
  rows: SalesReportRow[];
}

/** Query string shared by the report fetch and the CSV download, so both always describe the same report. */
export function salesReportQuery(type: SalesReportType, from: string | null, to: string | null): string {
  const params = new URLSearchParams({ type });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return params.toString();
}
