"use client";

import { useRouter } from "next/navigation";
import {
  PiFunnelFill,
  PiFileTextFill,
  PiReceiptFill,
  PiUsersThreeFill,
} from "react-icons/pi";
import { FaPersonWalkingLuggage } from "react-icons/fa6";
import { BsFillInboxesFill } from "react-icons/bs";
import type { IconType } from "react-icons";
import { Caption } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";
import { formatRelativeTime, formatEmbeddedDates } from "@/lib/date";
import type { AppNotification } from "@/features/notifications/types";
import { useAppDispatch } from "@/store/hooks";
import { markNotificationRead } from "@/features/notifications/notificationsThunks";

// Icon by type-prefix — reuses the same icon family each domain already uses
// elsewhere in the app (Leads: PiFunnelFill, Escapes: FaPersonWalkingLuggage, ...).
// Shared by the /notifications page (NotificationsPageContent) — the
// dropdown popup that used to also render this row was removed as unused.
function iconForType(type: string): IconType {
  if (type.startsWith("LEAD_")) return PiFunnelFill;
  if (type.startsWith("ESCAPE_")) return FaPersonWalkingLuggage;
  if (type.startsWith("QUOTATION_")) return PiFileTextFill;
  if (type.startsWith("PAYMENT_")) return PiReceiptFill;
  if (type.startsWith("FOLLOWUP_")) return BsFillInboxesFill;
  if (type.startsWith("USER_")) return PiUsersThreeFill;
  return PiFileTextFill;
}

function relatedEntityHref(notification: AppNotification): string | null {
  if (!notification.relatedEntityUid) return null;
  switch (notification.relatedEntityType) {
    case "LEAD":
      return `/leads/${notification.relatedEntityUid}`;
    case "ESCAPE":
      return `/escapes/${notification.relatedEntityUid}`;
    default:
      // QUOTE/PAYMENT_MILESTONE/FOLLOWUP/USER have no standalone detail page
      // of their own today — nothing to deep-link into.
      return null;
  }
}

export function NotificationRow({ notification, onNavigate }: { notification: AppNotification; onNavigate?: () => void }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const Icon = iconForType(notification.type);
  const href = relatedEntityHref(notification);

  function handleClick() {
    if (!notification.isRead) {
      dispatch(markNotificationRead(notification.uid));
    }
    if (href) {
      router.push(href);
      onNavigate?.();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <span
        className={cn(
          "flex h-2 w-2 shrink-0 items-center justify-center rounded-full",
          notification.isRead ? "bg-transparent" : "bg-primary",
        )}
        aria-hidden="true"
      />
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm", notification.isRead ? "font-medium text-muted-foreground" : "font-semibold text-foreground")}>
          {notification.title}
        </span>
        <span className="block text-sm text-muted-foreground line-clamp-2">{formatEmbeddedDates(notification.message)}</span>
        <Caption className="mt-0.5">{formatRelativeTime(notification.createdAt)}</Caption>
      </span>
    </button>
  );
}
