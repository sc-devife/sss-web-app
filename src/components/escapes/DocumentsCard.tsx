"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Caption } from "@/components/ui/Typography";
import type { Deal } from "@/lib/deals";

// A quote/invoice only becomes unambiguous once one has been accepted —
// before that an escape can have several itineraries each with several
// quote versions, with nothing marking one as "the" quotation. Deal.uid /
// Deal.acceptedQuoteUid are the same durable pointers DealPanel already uses
// for its own invoice-preview link, just surfaced here as Buttons instead of
// a text link, disabled until a deal exists.
export function DocumentsCard({ deal }: { deal: Deal | null }) {
  return (
    <Card variant="elevated" className="flex flex-col gap-2 p-3">
      <Caption className="font-semibold">Documents</Caption>
      <Button
        variant="secondary"
        size="sm"
        disabled={!deal}
        onClick={() => deal && window.open(`/quotes/${deal.acceptedQuoteUid}/preview`, "_blank", "noreferrer")}
      >
        Preview Quotation
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={!deal}
        onClick={() => deal && window.open(`/deals/${deal.uid}/invoice-preview`, "_blank", "noreferrer")}
      >
        Preview Invoice
      </Button>
    </Card>
  );
}
