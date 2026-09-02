"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { Body } from "@/components/ui/Typography";
import { LoadingState } from "@/components/ui/Spinner";
import { formatDisplayDateTime } from "@/lib/date";
import { formatAuditActor } from "@/lib/audit";
import type { IncomingTransaction } from "@/lib/transactions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchIncomingTransactions } from "@/features/transactions/transactionsThunks";
import {
  selectIncomingTransactions,
  selectIncomingTransactionsStatus,
  selectIncomingTransactionsError,
} from "@/features/transactions/transactionsSelectors";
import { PiArrowDownLeftBold, PiArrowUpRightBold } from "react-icons/pi";

// Matches DealPanel.tsx's PAYMENT_METHOD_OPTIONS values — kept as its own
// small map here rather than a shared import, since this is a display-only
// lookup and the two components don't otherwise share code.
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  upi: "UPI",
  neft: "NEFT",
  rtgs: "RTGS",
  imps: "IMPS",
  bank_transfer: "Bank Transfer",
  card: "Card",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other",
};

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
      render: (t) => (t.paymentMethod ? PAYMENT_METHOD_LABELS[t.paymentMethod] ?? t.paymentMethod : "—"),
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

  if (status === "loading" && transactions.length === 0) {
    return <LoadingState label="Loading incoming transactions…" />;
  }

  if (status === "failed") {
    return <Body className="text-danger">{error}</Body>;
  }

  return (
    <DataTable
      columns={columns}
      rows={transactions}
      rowKey={(t) => t.milestoneUid}
      searchPlaceholder="Search by customer, amount, reference…"
      emptyMessage="No incoming payments recorded yet."
      onRowClick={(t) => router.push(`/escapes/${t.escapeUid}`)}
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
            className={`group flex items-center gap-2 rounded-3xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${activeTab === "incoming"
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
            className={`group flex items-center gap-2 rounded-3xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${activeTab === "outgoing"
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
      {activeTab === "incoming" ? (
        <IncomingTransactionsTable />
      ) : (
        <ComingSoon
          title="Outgoing Transactions"
          section="Accounting"
          icon={PiArrowUpRightBold}
        />
      )}
    </div>
  );
}
