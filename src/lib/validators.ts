// Shared form validators — previously duplicated 4-6x inline across
// Login/Register/ForgotPassword/InviteUser in the old app. One copy, reused
// by every form.

import { isValidPhoneNumber } from "react-phone-number-input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
const USER_ID_RE = /^[a-zA-Z0-9._]{3,30}$/;
const PHONE_RE = /^\d{10}$/;
// Must mirror SignupCreateRequestDTO's @Pattern exactly (backend/.../dto/signup) —
// the signup endpoint rejects anything this doesn't match, unlike reset-password.
const SIGNUP_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*#?&])[A-Za-z\d.@$!%*#?&]{8,}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const SWIFT_RE = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
// Deliberately permissive: bank account "country" is free text in this app,
// not a code-based dropdown, so there's no reliable signal to apply a
// stricter country-specific numeric rule without rejecting valid non-Indian
// account numbers.
const ACCOUNT_NUMBER_RE = /^[A-Za-z0-9]{5,34}$/;
// Must mirror OrganizationsDto's website/instagram/linkedin @Pattern exactly
// (backend/.../dto/organizations) — requires an absolute http(s) URL.
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function isValidPassword(value: string): boolean {
  return PASSWORD_RE.test(value);
}

export function isValidUserId(value: string): boolean {
  return USER_ID_RE.test(value);
}

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value);
}

export function isValidSignupPassword(value: string): boolean {
  return SIGNUP_PASSWORD_RE.test(value);
}

export const validationMessages = {
  email: "Enter a valid email address",
  password:
    "Password must be at least 6 characters and include an uppercase letter, a lowercase letter, a number, and a special character",
  signupPassword:
    "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and one of . @ $ ! % * # ? &",
  userId: "User ID must be 3-30 characters (letters, numbers, dots, underscores)",
  phone: "Enter a valid 10-digit phone number",
};

// Composable field validators for hand-rolled useState forms. Each form
// builds its own small `validate(values)` function out of these, e.g.:
//   err("email", [required(), emailField()])
// No shared "form schema" abstraction — every module's field set differs
// enough that a generic engine would be more indirection than the ~10 lines
// it replaces.
export type FieldValidator = (value: string) => string | undefined;

export const required =
  (msg = "This field is required"): FieldValidator =>
  (v) =>
    v.trim() ? undefined : msg;

export const minLength =
  (n: number, msg?: string): FieldValidator =>
  (v) =>
    v.trim().length > 0 && v.trim().length < n ? (msg ?? `Must be at least ${n} characters`) : undefined;

export const maxLength =
  (n: number, msg?: string): FieldValidator =>
  (v) =>
    v.trim().length > n ? (msg ?? `Must be at most ${n} characters`) : undefined;

export const pattern =
  (re: RegExp, msg: string): FieldValidator =>
  (v) =>
    v.trim().length > 0 && !re.test(v.trim()) ? msg : undefined;

export const emailField = (msg = validationMessages.email): FieldValidator => pattern(EMAIL_RE, msg);
// PhoneInput always submits a full "+<code><digits>" E.164 string once a
// country is selected in its flag dropdown — a non-empty value missing that
// "+" prefix means no calling code was captured. Run this before
// `mobileField()` so a missing code surfaces this specific message rather
// than the generic "invalid phone number" one.
export const countryCodeField =
  (msg = "Country code is required"): FieldValidator =>
  (v) =>
    v.trim().length > 0 && !/^\+\d/.test(v.trim()) ? msg : undefined;
// Real per-country length/format validation via libphonenumber-js's metadata
// (through the react-phone-number-input re-export) — the PhoneInput
// component always submits a full E.164 string (e.g. "+919876543213"), so
// this only needs to check that shape is genuinely valid for its country.
export const mobileField =
  (msg = "Enter a valid phone number"): FieldValidator =>
  (v) =>
    v.trim().length > 0 && !isValidPhoneNumber(v.trim()) ? msg : undefined;
export const ifscField = (msg = "Enter a valid IFSC code (e.g. HDFC0001234)"): FieldValidator =>
  pattern(IFSC_RE, msg);
export const swiftField = (msg = "Enter a valid SWIFT/BIC code (e.g. HDFCINBB or HDFCINBBXXX)"): FieldValidator =>
  pattern(SWIFT_RE, msg);
export const accountNumberField = (msg = "Enter a valid account number"): FieldValidator =>
  pattern(ACCOUNT_NUMBER_RE, msg);
export const urlField = (msg = "Enter a valid URL starting with http:// or https://"): FieldValidator =>
  pattern(URL_RE, msg);

// Numeric validators operate on optional numeric-string fields (empty means
// "not provided" and always passes — pair with `required()` if the field is
// mandatory).
export const positiveNumber =
  (msg = "Must be a positive number"): FieldValidator =>
  (v) => {
    if (!v.trim()) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? undefined : msg;
  };

export const numberInRange =
  (min: number, max: number, msg?: string): FieldValidator =>
  (v) => {
    if (!v.trim()) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? undefined : (msg ?? `Must be between ${min} and ${max}`);
  };

export const integerField =
  (msg = "Must be a whole number"): FieldValidator =>
  (v) => {
    if (!v.trim()) return undefined;
    return Number.isInteger(Number(v)) ? undefined : msg;
  };

// Runs validators in order, returns the first failure (or undefined).
export function runValidators(value: string, validators: FieldValidator[]): string | undefined {
  for (const v of validators) {
    const err = v(value);
    if (err) return err;
  }
  return undefined;
}

// For Selects/dropdowns where the value is a business key, not free text.
export function requiredSelection(value: string, msg = "Please make a selection"): string | undefined {
  return value ? undefined : msg;
}

// Case-insensitive duplicate check against a list of existing records
// (e.g. destination codes, tax profile names) — excludes the record being
// edited so re-saving an unchanged value doesn't flag itself.
export function notDuplicate<T>(
  items: T[],
  getValue: (item: T) => string,
  msg = "This value is already in use",
  excludeUid?: string,
  getUid?: (item: T) => string,
): FieldValidator {
  return (v) => {
    const normalized = v.trim().toLowerCase();
    if (!normalized) return undefined;
    const clash = items.some(
      (item) =>
        (!excludeUid || !getUid || getUid(item) !== excludeUid) && getValue(item).trim().toLowerCase() === normalized,
    );
    return clash ? msg : undefined;
  };
}
