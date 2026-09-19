"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { getLeadPeriodRange, shiftLeadPeriodAnchor, type LeadPeriodType } from "@/lib/lead-period";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Body } from "@/components/ui/Typography";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/date";
import { formatAuditActor } from "@/lib/audit";
import { formatInr } from "@/lib/currency";
import { paymentMethodLabel } from "@/lib/payment-methods";
import type { IncomingTransaction, OutgoingTransaction } from "@/lib/transactions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchIncomingTransactions, fetchOutgoingTransactions } from "@/features/transactions/transactionsThunks";
import {
  selectIncomingTransactions,
  selectIncomingTransactionsStatus,
  selectIncomingTransactionsError,
  selectOutgoingTransactions,
  selectOutgoingTransactionsStatus,
  selectOutgoingTransactionsError,
} from "@/features/transactions/transactionsSelectors";
import { PiArrowDownLeftBold, PiArrowUpRightBold } from "react-icons/pi";

// Month/Week/Day/All navigator (same control as the Leads page). The lists are
// fetched whole, so the period is applied client-side against `getDate` —
// the row's own transaction date. Defaults to the current month like Leads.
function usePeriodFilter<T>(rows: T[], getDate: (row: T) => string | null | undefined) {
  const [type, setType] = useState<LeadPeriodType>("month");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const range = getLeadPeriodRange(type, anchor);

  const filtered = rows.filter((row) => {
    if (!range.from || !range.to) return true;
    // "YYYY-MM-DD" prefix compares lexically, and works for both plain dates
    // and full ISO timestamps.
    const date = getDate(row)?.slice(0, 10);
    return !!date && date >= range.from && date <= range.to;
  });

  const control = (
    <PeriodFilter
      type={type}
      label={range.label}
      onTypeChange={(next) => {
        setType(next);
        setAnchor(new Date());
      }}
      onStep={(direction) => setAnchor((a) => shiftLeadPeriodAnchor(type, a, direction))}
    />
  );
  return { filtered, control, isAll: type === "all" };
}

const STATUS_TONES: Record<string, "success" | "warning" | "neutral"> = {
  paid: "success",
  partially_paid: "warning",
  unverified: "warning",
};

function IncomingTransactionsTable() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectIncomingTransactions);
  const status = useAppSelector(selectIncomingTransactionsStatus);
  const error = useAppSelector(selectIncomingTransactionsError);

  useEffect(() => {
    dispatch(fetchIncomingTransactions());
  }, [dispatch]);

  const period = usePeriodFilter(transactions, (t) => t.markedPaidAt);

  const columns: DataTableColumn<IncomingTransaction>[] = [
    {
      key: "customer",
      header: "From",
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{t.customerName}</span>
          {t.customerPhone && <span className="text-xs text-muted-foreground">{t.customerPhone}</span>}
        </div>
      ),
      filterValue: (t) => `${t.customerName} ${t.customerEmail ?? ""} ${t.customerPhone ?? ""}`,
    },
    {
      key: "label",
      header: "Milestone",
      render: (t) => t.label,
      filterValue: (t) => t.label,
    },
    {
      key: "amountPaidInr",
      header: "Amount",
      render: (t) => `₹${t.amountPaidInr.toFixed(2)}`,
      sortValue: (t) => t.amountPaidInr,
    },
    {
      key: "paymentMethod",
      header: "Method",
      render: (t) => (t.paymentMethod ? paymentMethodLabel(t.paymentMethod) : "—"),
      filterValue: (t) => t.paymentMethod ?? "",
    },
    {
      key: "paymentReference",
      header: "Payment ID / UTR",
      render: (t) => t.paymentReference ?? "—",
      filterValue: (t) => t.paymentReference ?? "",
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <Badge tone={STATUS_TONES[t.status] ?? "neutral"}>{t.status}</Badge>,
      sortValue: (t) => t.status,
    },
    {
      key: "markedPaidAt",
      header: "Recorded",
      render: (t) => (
        <div className="flex flex-col">
          <span>{t.markedPaidAt ? formatDisplayDateTime(t.markedPaidAt) : "—"}</span>
          <span className="text-xs text-muted-foreground">by {formatAuditActor(t.markedPaidByName)}</span>
        </div>
      ),
      sortValue: (t) => t.markedPaidAt ?? "",
    },
  ];

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <DataTable
      columns={columns}
      rows={period.filtered}
      rowKey={(t) => t.milestoneUid}
      toolbarExtra={<div className="flex items-center gap-2">{period.control}</div>}
      searchPlaceholder="Search by customer, amount, reference…"
      emptyMessage={period.isAll ? "No incoming payments recorded yet." : "No incoming payments in this period."}
      onRowClick={(t) => router.push(`/escapes/${t.escapeUid}`)}
      loading={status !== "succeeded" && transactions.length === 0}
    />
  );
}

// Backed by HotelPayment (see HotelDetailPanel's own Payments tab, where
// these are recorded) — the same data, just rolled up across every hotel in
// the org instead of scoped to one hotel's page.
function OutgoingTransactionsTable() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const transactions = useAppSelector(selectOutgoingTransactions);
  const status = useAppSelector(selectOutgoingTransactionsStatus);
  const error = useAppSelector(selectOutgoingTransactionsError);

  useEffect(() => {
    dispatch(fetchOutgoingTransactions());
  }, [dispatch]);

  const period = usePeriodFilter(transactions, (t) => t.paymentDate);

  const columns: DataTableColumn<OutgoingTransaction>[] = [
    {
      key: "vendorName",
      header: "To",
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{t.vendorName}</span>
          <span className="text-xs text-muted-foreground">{t.vendorType}</span>
        </div>
      ),
      filterValue: (t) => `${t.vendorName} ${t.vendorType}`,
    },
    {
      key: "tripCode",
      header: "Escape ID",
      render: (t) => t.tripCode ?? "—",
      filterValue: (t) => t.tripCode ?? "",
    },
    {
      key: "transactionId",
      header: "Transaction ID",
      render: (t) => t.transactionId ?? "—",
      filterValue: (t) => t.transactionId ?? "",
    },
    {
      key: "paymentMethod",
      header: "Method",
      render: (t) => paymentMethodLabel(t.paymentMethod),
      filterValue: (t) => t.paymentMethod,
    },
    {
      key: "amount",
      header: "Amount",
      render: (t) => formatInr(t.amount),
      sortValue: (t) => t.amount,
    },
    {
      key: "paidBy",
      header: "Paid By",
      render: (t) => t.paidBy ?? "—",
      filterValue: (t) => t.paidBy ?? "",
    },
    {
      key: "paymentDate",
      header: "Payment Date",
      render: (t) => formatDisplayDate(t.paymentDate) ?? "—",
      sortValue: (t) => t.paymentDate,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <Badge tone={t.status === "Paid" ? "success" : "neutral"}>{t.status}</Badge>,
      sortValue: (t) => t.status,
    },
  ];

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <DataTable
      columns={columns}
      rows={period.filtered}
      rowKey={(t) => t.paymentUid}
      toolbarExtra={<div className="flex items-center gap-2">{period.control}</div>}
      searchPlaceholder="Search by hotel, escape ID, amount…"
      emptyMessage={period.isAll ? "No outgoing payments recorded yet." : "No outgoing payments in this period."}
      onRowClick={(t) =>
        router.push(t.vendorType === "Hotel" ? `/library/hotels/${t.vendorUid}` : `/library/activities/${t.vendorUid}`)
      }
      loading={status !== "succeeded" && transactions.length === 0}
    />
  );
}

export function TransactionsPanel() {
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming")
  return (
    <div className="mx-auto w-full">
      {/* Modern Tabs */}
      <div className="flex items-center justify-center gap-4">
        <div className="mb-6 flex w-fit items-center gap-1 rounded-3xl border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={`group flex items-center gap-2 rounded-3xl px-5 py-2 text-sm font-medium transition-all duration-200 ${activeTab === "incoming"
              ? "bg-primary text-white shadow-sm ring-1 ring-gray-200"
              : "text-gray-500 hover:bg-white/70 hover:text-gray-900"
              }`}
          >
            <PiArrowDownLeftBold
              className={`text-lg transition-colors ${activeTab === "incoming"
                ? "text-white"
                : "text-gray-400 group-hover:text-gray-600"
                }`}
            />
            Incoming
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outgoing")}
            className={`group flex items-center gap-2 rounded-3xl px-5 py-2 text-sm font-medium transition-all duration-200 ${activeTab === "outgoing"
              ? "bg-primary text-white shadow-sm ring-1 ring-gray-200"
              : "text-gray-500 hover:bg-white/70 hover:text-gray-900"
              }`}
          >
            <PiArrowUpRightBold
              className={`text-lg transition-colors ${activeTab === "outgoing"
                ? "text-white"
                : "text-gray-400 group-hover:text-gray-600"
                }`}
            />
            Outgoing
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "incoming" ? <IncomingTransactionsTable /> : <OutgoingTransactionsTable />}
    </div>
  );
}
