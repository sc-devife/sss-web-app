import { IoCheckmark } from "react-icons/io5";
import { cn } from "@/lib/cn";

// Checkbox drawn as a selectable pill: the native input stays (visually
// hidden, so keyboard + screen-reader behavior is unchanged) and a styled box
// with a checkmark plus a tinted, bordered label reflect its state.
export function CheckOption({
  checked,
  onChange,
  disabled,
  className,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
        checked
          ? "border-primary/40 bg-primary/5 text-primary"
          : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50",
        className,
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-card",
        )}
      >
        {checked && <IoCheckmark size={14} />}
      </span>
      {children}
    </label>
  );
}
