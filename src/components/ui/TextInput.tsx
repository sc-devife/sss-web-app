import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextInput({ label, error, id, className, ...props }: TextInputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "h-10 rounded border border-border bg-background px-3 text-sm text-foreground",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          error && "border-danger",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
