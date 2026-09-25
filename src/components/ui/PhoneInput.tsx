"use client";

import { useId } from "react";
import RPNInput, { type Country, getCountries, getCountryCallingCode } from "react-phone-number-input";
import baseLabels from "react-phone-number-input/locale/en.json";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { cn } from "@/lib/cn";
import { useFormAppearance } from "@/components/ui/FormAppearance";

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
  const pill = useFormAppearance() === "pill";
  const baseInputClassName = inputClassName ?? (pill ? "app-phone-input app-phone-input-pill" : "app-phone-input");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className={labelClassName ?? "text-sm font-medium text-foreground"}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <RPNInput
        id={inputId}
        // The calling code (+91) shows as a fixed, non-editable prefix inside the number
        // field itself, and follows the country picked in the flag dropdown. The value
        // handed to onChange is still the full E.164 number.
        international
        withCountryCallingCode
        countryCallingCodeEditable={false}
        addInternationalOption={false}
        defaultCountry={defaultCountry}
        labels={labelsWithDialCode}
        countrySelectComponent={CountrySelect}
        value={value || undefined}
        onChange={(v) => onChange(v ?? "")}
        disabled={disabled}
        placeholder={placeholder}
        // Error modifier is derived from whichever base class is active
        // ("app-phone-input-error" / "signup-phone-input-error", see
        // globals.css) rather than only ever applying to the default base
        // class — a caller-supplied inputClassName still needs its own
        // error styling, it just isn't the shared theme-token look.
        className={cn(baseInputClassName, error && `${baseInputClassName}-error`)}
        aria-invalid={!!error}
        aria-required={required}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
