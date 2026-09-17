"use client";

import { useEffect, useState } from "react";
import { MdHotel } from "react-icons/md";
import { PiMountainsFill } from "react-icons/pi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Body, Caption } from "@/components/ui/Typography";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDisplayDate } from "@/lib/date";
import { formatInr } from "@/lib/currency";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import type { OutgoingTransaction } from "@/features/transactions/types";

// Read-only — HotelPayment/ActivityPayment records are created from the
// Hotel/Activity library's own Payments tab (a vendor payout isn't itself an
// Escape action), this just surfaces the ones already recorded against this
// Escape so they're visible in context instead of only in Accounting >
// Transactions > Outgoing.
export function SupplierPaymentsPanel({ escapeUid }: { escapeUid: string }) {
  const [payments, setPayments] = useState<OutgoingTransaction[] | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    setPayments(null);
    setError(undefined);
    clientApi
      .get<OutgoingTransaction[]>(`/transactions/outgoing?escapeUid=${escapeUid}`)
      .then((res) => {
        if (!cancelled) setPayments(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, "Failed to load supplier payments"));
      });
    return () => {
      cancelled = true;
    };
  }, [escapeUid]);

  if (payments == null && !error) {
    return (
      <Card className="flex flex-col gap-3">
        <Caption>Supplier payments</Caption>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col gap-3">
        <Caption>Supplier payments</Caption>
        <Body className="text-danger">{error}</Body>
      </Card>
    );
  }

  if (payments!.length === 0) {
    return (
      <Card className="flex flex-col gap-3">
        <Caption>Supplier payments</Caption>
        <div className="flex items-center justify-center rounded border border-border py-10">
          <Body muted>No hotel or activity payouts recorded for this escape yet.</Body>
        </div>
      </Card>
    );
  }

  const total = payments!.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Caption>Supplier payments</Caption>
        <span className="text-sm font-semibold text-foreground">{formatInr(total)} total</span>
      </div>
      <div className="flex flex-col gap-2">
        {payments!.map((p) => {
          const Icon = p.vendorType === "Hotel" ? MdHotel : PiMountainsFill;
          return (
            <div key={p.paymentUid} className="flex items-start gap-3 rounded border border-border px-3 py-2 text-sm">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="neutral">{p.vendorType}</Badge>
                  <span className="font-medium text-foreground">{p.vendorName}</span>
                </div>
                <Caption className="mt-0.5 block normal-case text-muted-foreground">
                  {formatDisplayDate(p.paymentDate)} · {p.paymentMethod}
                  {p.transactionId && ` · Ref: ${p.transactionId}`}
                  {p.paidBy && ` · Paid by ${p.paidBy}`}
                </Caption>
                {p.notes && <Caption className="mt-0.5 block normal-case text-muted-foreground">{p.notes}</Caption>}
              </div>
              <span className="shrink-0 font-semibold text-foreground">{formatInr(p.amount)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
