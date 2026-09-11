import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button. Existing call sites that hand-roll
   * their own spinner+text swap are unaffected — this is purely additive. */
  loading?: boolean;
  /** Text shown in place of children while `loading` is true. */
  loadingText?: string;
  /** Spinner color while loading. Defaults to "current" (inherits the
   * button's own text color) since a literal border-primary/border-danger
   * would blend into a same-toned solid-fill button — pass an explicit tone
   * when the spinner needs to read as a specific color regardless of the
   * button's own variant (e.g. a fixed "primary" tone across a row of
   * differently-styled buttons). */
  spinnerTone?: "primary" | "current" | "danger";
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-muted text-foreground hover:bg-muted/70 border border-border",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  spinnerTone = "current",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
        "disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner size="sm" tone={spinnerTone} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
