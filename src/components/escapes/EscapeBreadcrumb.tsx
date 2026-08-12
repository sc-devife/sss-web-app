import Link from "next/link";
import { IoChevronBackOutline, IoHomeOutline } from "react-icons/io5";
import { Badge } from "@/components/ui/Badge";
import { escapeStatusTone, escapeStatusIcon } from "@/lib/escape-status";
import type { Escape } from "@/lib/escapes";

// Compact top-of-page wayfinding: "< Escapes / <lead name> [status]" — not a
// full PageHeader (that component's h1 + description is too heavy for this).
// Status always comes from escape.status (real backend/state value), never
// hard-coded, so it stays correct as the workflow advances.
export function EscapeBreadcrumb({ escape }: { escape: Escape }) {
  const leadName = escape.lead?.name ?? `Escape #${escape.uid}`;

  return (
    <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-sm">
      <Link
        href="/dashboard"
        aria-label="Dashboard"
        className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <IoHomeOutline size={14} />
      </Link>
      <span className="text-muted-foreground">|</span>
      <Link
        href="/escapes"
        className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <IoChevronBackOutline size={14} />
        Escapes
      </Link>
      <span className="text-muted-foreground">/</span>
      <span className="truncate font-medium text-foreground">{leadName}</span>
      <Badge tone={escapeStatusTone(escape.status)} icon={escapeStatusIcon(escape.status)}>
        {escape.status}
      </Badge>
    </nav>
  );
}
