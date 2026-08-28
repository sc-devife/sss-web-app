"use client";

import { useId } from "react";
import RPNInput, { type Country, getCountries, getCountryCallingCode } from "react-phone-number-input";
import baseLabels from "react-phone-number-input/locale/en.json";
import { cn } from "@/lib/cn";

// Augments the library's default "India" / "United States" country-select
// labels with the dialing code ("India (+91)") so the dropdown shows flag +
// name + dial code together, per the app's phone-input UX requirement.
// Built once at module scope, not per-render.
const labelsWithDialCode: Record<string, string> = { ...baseLabels };
for (const country of getCountries()) {
  const name = (baseLabels as Record<string, string>)[country];
  if (name) {
    labelsWithDialCode[country] = `${name} (+${getCountryCallingCode(country)})`;
  }
}

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
  /** Overrides the field box's own classes (default: the app's standard
   * h-10/border-token box) — for the one page with a fully custom, non-
   * theme-token visual style (signup) that doesn't use the shared look. */
  inputClassName?: string;
  /** Overrides the label's own classes, same reasoning as inputClassName. */
  labelClassName?: string;
  /** Overrides the default country (India) shown before the user picks one
   * or types a number — e.g. a form specifically for a non-Indian region. */
  defaultCountry?: Country;
}

export function PhoneInput({
  label,
  value,
  onChange,
  error,
  required,
  disabled,
  placeholder,
  id,
  className,
  inputClassName,
  labelClassName,
  defaultCountry = "IN",
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className={labelClassName ?? "text-sm font-medium text-foreground"}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <RPNInput
        id={inputId}
        international
        // The number field must hold only the local number — the calling
        // code is picked exclusively via the country dropdown, never typed
        // inline (confirmed live: without this, typing digits into the
        // number field can get misparsed as a different country's calling
        // code, e.g. "2025550123" silently becoming Egypt's +20 prefix).
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        labels={labelsWithDialCode}
        value={value || undefined}
        onChange={(v) => onChange(v ?? "")}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(inputClassName ?? "app-phone-input", error && (inputClassName ? "" : "app-phone-input-error"))}
        aria-invalid={!!error}
        aria-required={required}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
