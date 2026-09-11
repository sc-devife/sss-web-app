"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { isValidSignupPassword, isValidUserId, validationMessages } from "@/lib/validators";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { LuLock, LuMail, LuUserRound, LuUserRoundCheck } from "react-icons/lu";

// Byte-for-byte the Login page's own input recipe (src/app/(auth)/login/page.tsx)
// — border/radius/height/padding/font/focus/placeholder all reuse the same
// design-system tokens instead of this page's former one-off hex values.
const inputClass = (hasError = false) =>
  `h-11 w-full rounded-xl border bg-background px-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground
   focus:ring-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground
   ${hasError
    ? "border-danger focus:border-danger focus:ring-danger/20"
    : "border-border focus:border-primary focus:ring-primary/20"
  }`;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userId, setUserId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(undefined);

    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!isValidUserId(userId)) nextErrors.userId = validationMessages.userId;
    if (!mobileNumber.trim() || !isValidPhoneNumber(mobileNumber)) nextErrors.mobileNumber = "Enter a valid phone number";
    if (!isValidSignupPassword(password)) nextErrors.password = validationMessages.signupPassword;
    if (!confirmPassword) nextErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await clientApi.post("/auth/signup", {
        invitationToken,
        first_name: firstName,
        last_name: lastName,
        userId,
        email,
        mobileNumber,
        password,
      });
      toast.success("Account created successfully.");
      router.push("/login?signedUp=1");
    } catch (err) {
      // Toast so the failure is noticed even if attention isn't on the form
      // right now, plus the existing inline message for in-context detail —
      // matching the Login page's own "never rely on inline alone" pattern.
      const message = extractErrorMessage(err, "Failed to complete signup");
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (!invitationToken || !email) {
    return (
      <Body className="text-center text-[16px] text-red-500">
        This invitation link is missing required information. Ask your organization&apos;s admin to send
        you a new invite.
      </Body>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="w-full">
        <label
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Email
        </label>

        <div className="relative">
          <LuMail
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
          />

          <input
            value={email}
            disabled
            readOnly
            className={`${inputClass(false)} cursor-not-allowed bg-muted text-muted-foreground`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="w-full">
          <label
            htmlFor="firstName"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            First name
          </label>

          <div className="relative">
            <LuUserRound
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
            />

            <input
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors((p) => ({ ...p, firstName: "" }));
              }}
              disabled={loading}
              placeholder="First name"
              className={inputClass(!!errors.firstName)}
            />
          </div>

          {errors.firstName && (
            <Body className="mt-1 text-sm text-danger">
              {errors.firstName}
            </Body>
          )}
        </div>

        <div className="w-full">
          <label
            htmlFor="lastName"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Last name
          </label>

          <div className="relative">
            <LuUserRound
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
            />

            <input
              id="lastName"
              name="lastName"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors((p) => ({ ...p, lastName: "" }));
              }}
              disabled={loading}
              placeholder="Last name"
              className={inputClass(!!errors.lastName)}
            />
          </div>

          {errors.lastName && (
            <Body className="mt-1 text-sm text-danger">
              {errors.lastName}
            </Body>
          )}
        </div>
      </div>

      <div className="w-full">
        <label
          htmlFor="userId"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          User ID
        </label>

        <div className="relative">
          <LuUserRoundCheck
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
          />

          <input
            id="userId"
            name="userId"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setErrors((p) => ({ ...p, userId: "" }));
            }}
            disabled={loading}
            placeholder="Choose a user ID"
            className={inputClass(!!errors.userId)}
          />
        </div>

        {errors.userId && (
          <Body className="mt-1 text-sm text-danger">
            {errors.userId}
          </Body>
        )}
      </div>

      <div className="w-full">
        <PhoneInput
          label="Mobile number"
          value={mobileNumber}
          onChange={(v) => { setMobileNumber(v); setErrors((p) => ({ ...p, mobileNumber: "" })); }}
          error={errors.mobileNumber}
          disabled={loading}
          defaultCountry="IN"
          inputClassName="signup-phone-input"
          // No mb-1.5 here (unlike every other field's label on this page) —
          // PhoneInput's own wrapper already applies gap-1.5 between the
          // label and the field, so adding mb-1.5 too doubled the gap to
          // 12px instead of the 6px every other field on this page uses.
          labelClassName="block text-sm font-medium text-foreground"
        />
      </div>

      <div className="w-full">
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Password
        </label>

        <div className="relative">
          <LuLock
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
          />

          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((p) => ({ ...p, password: "" }));
            }}
            autoComplete="new-password"
            disabled={loading}
            placeholder="Create a password"
            className={`${inputClass(!!errors.password)} pr-12`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {errors.password ? (
          <Body className="mt-1 text-sm text-danger">
            {errors.password}
          </Body>
        ) : (
          <Body className="mt-1 text-xs text-muted-foreground">
            At least 8 characters, with upper, lower, a number, and one of . @ $ ! % * # ? &
          </Body>
        )}
      </div>

      <div className="w-full">
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Confirm password
        </label>

        <div className="relative">
          <LuLock
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
          />

          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            autoComplete="new-password"
            disabled={loading}
            placeholder="Re-enter your password"
            className={`${inputClass(!!errors.confirmPassword)} pr-12`}
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((p) => !p)}
            disabled={loading}
            aria-label={
              showConfirmPassword ? "Hide password" : "Show password"
            }
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {errors.confirmPassword && (
          <Body className="mt-1 text-sm text-danger">
            {errors.confirmPassword}
          </Body>
        )}
      </div>

      {formError && <Body className="text-sm text-red-500 text-center">{formError}</Body>}

      <Button type="submit" loading={loading} loadingText="Creating account…"
        className="mt-3 h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md">
        Create account
      </Button>
    </form>
  );
}

// Same background treatment as the Login page (src/app/(auth)/login/page.tsx)
// — identical layers/classes reusing the same /travel-background.svg asset,
// rather than a second copy of the image or a one-off look for this page.
export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f7fbfd]">

      {/* BASE BACKGROUND */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-[linear-gradient(135deg,#ffffff_0%,#f8fcfe_45%,#edf7fb_100%)]
        "
      />

      {/* MAP BACKGROUND */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          overflow-hidden
        "
      >
        <img
          src="/travel-background.svg"
          alt=""
          className="
            absolute
            left-1/2
            top-1/2
            h-full
            w-full
            min-h-full
            min-w-full
            -translate-x-1/2
            -translate-y-1/2
            object-cover
            object-center
            opacity-90
            select-none
          "
        />

        {/* Soft fade */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_15%,rgba(255,255,255,0.5)_70%,rgba(255,255,255,0.78)_100%)]
          "
        />
      </div>

      {/* SIGNUP CONTENT */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6">
        <Card className="w-full max-w-[560px] rounded-[16px] px-6 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:px-8 sm:py-8">
          <Heading as="h1" className="mb-2 text-center text-[26px] font-bold text-black">
            Complete your signup
          </Heading>
          <Body muted className="mb-7 text-center text-[16px]">
            You&apos;ve been invited to join your organization&apos;s Travel CRM workspace.
          </Body>
          <Suspense>
            <SignupForm />
          </Suspense>
          <div className="mt-2 text-center">
            <Link href="/login" className="text-[16px] text-[#6f6f6f] transition hover:text-black hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
