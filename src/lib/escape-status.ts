import type { IconType } from "react-icons";
import { IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from "react-icons/io5";

// Mirrors backend EscapeStatus.ORDER (com.sss.app.entity.escape.EscapeStatus) —
// keep in sync if that ever changes.
export const ESCAPE_STATUS_ORDER = [
  "Planning",
  "Itinerary Drafting",
  "Quotation Sent",
  "Quote Accepted",
  "Payment Pending",
  "Partially Paid",
  "Fully Paid",
  "Escape Confirmed",
  "Ongoing",
  "Completed",
] as const;

export const ESCAPE_STATUS_CANCELLED = "Cancelled";

// Shared status -> Badge tone/icon mapping, used everywhere an escape's
// status is shown as a badge (breadcrumb, summary card) so the two can't
// drift out of sync with each other.
export function escapeStatusTone(status: string): "success" | "danger" | "neutral" {
  if (status === ESCAPE_STATUS_CANCELLED) return "danger";
  if (status === "Completed") return "success";
  return "neutral";
}

export function escapeStatusIcon(status: string): IconType {
  const tone = escapeStatusTone(status);
  if (tone === "success") return IoCheckmarkCircle;
  if (tone === "danger") return IoCloseCircle;
  return IoTimeOutline;
}
