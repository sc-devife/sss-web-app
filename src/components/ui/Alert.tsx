import { useEffect, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { PiCheckCircleFill, PiWarningFill, PiWarningCircleFill, PiInfoFill } from "react-icons/pi";
import { cn } from "@/lib/cn";

export type AlertTone = "success" | "warning" | "danger" | "info" | "neutral";

interface AlertProps {
  tone?: AlertTone;
  icon?: IconType;
  children: ReactNode;
  className?: string;
  autoClose?: boolean;
  durationMs?: number;
}

// Extracted from OrganizationForm's original inline banners so every form's
// success/error/warning message looks the same. This is the persistent,
// in-context counterpart to the ephemeral toast system — use Alert for a
// message tied to a specific form's state, toasts for one-off notifications.
const toneClasses: Record<AlertTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-primary/30 bg-primary/10 text-primary",
  neutral: "border-border bg-muted text-foreground",
};

const defaultIcons: Record<AlertTone, IconType> = {
  success: PiCheckCircleFill,
  warning: PiWarningFill,
  danger: PiWarningCircleFill,
  info: PiInfoFill,
  neutral: PiInfoFill,
};

export function Alert({ tone = "info", icon, children, className, autoClose = true, durationMs = 3000 }: AlertProps) {
  const [visible, setVisible] = useState(true);
  const Icon = icon ?? defaultIcons[tone];

  useEffect(() => {
    if (!autoClose) return;

    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [autoClose, durationMs]);

  if (!visible) return null;

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-4", toneClasses[tone], className)}>
      <Icon className="text-xl shrink-0" />
      <span>{children}</span>
    </div>
  );
}
