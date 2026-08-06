"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IoMailOutline, IoLockClosedOutline, IoPersonOutline } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { isValidSignupPassword, isValidUserId, validationMessages } from "@/lib/validators";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";

function fieldClass(hasError: boolean) {
  return `relative ${hasError ? "rounded-[10px] ring-1 ring-red-500" : ""}`;
}

const inputClass =
  "h-11 w-full rounded-[10px] border border-[#c8c8c8] bg-transparent px-14 text-[15px] text-black outline-none transition placeholder:text-[#aaa] focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50";

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
      router.push("/login?signedUp=1");
    } catch (err) {
      setFormError(extractErrorMessage(err, "Failed to complete signup"));
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
        <label className="mb-1.5 block text-[14px] text-[#171717]">Email</label>
        <div className="relative">
          <IoMailOutline
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-[#c8c8c8]"
          />
          <input value={email} disabled readOnly className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="w-full">
          <label htmlFor="firstName" className="mb-1.5 block text-[14px] text-[#171717]">First name</label>
          <div className={fieldClass(!!errors.firstName)}>
            <IoPersonOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-[#c8c8c8]" />
            <input id="firstName" name="firstName" value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: "" })); }}
              disabled={loading} placeholder="First name" className={inputClass} />
          </div>
          {errors.firstName && <Body className="mt-1 text-sm text-red-500">{errors.firstName}</Body>}
        </div>
        <div className="w-full">
          <label htmlFor="lastName" className="mb-1.5 block text-[14px] text-[#171717]">Last name</label>
          <div className={fieldClass(!!errors.lastName)}>
            <IoPersonOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-[#c8c8c8]" />
            <input id="lastName" name="lastName" value={lastName}
              onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: "" })); }}
              disabled={loading} placeholder="Last name" className={inputClass} />
          </div>
          {errors.lastName && <Body className="mt-1 text-sm text-red-500">{errors.lastName}</Body>}
        </div>
      </div>

      <div className="w-full">
        <label htmlFor="userId" className="mb-1.5 block text-[14px] text-[#171717]">User ID</label>
        <div className={fieldClass(!!errors.userId)}>
          <IoPersonOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-[#c8c8c8]" />
          <input id="userId" name="userId" value={userId}
            onChange={(e) => { setUserId(e.target.value); setErrors((p) => ({ ...p, userId: "" })); }}
            disabled={loading} placeholder="Choose a user ID" className={inputClass} />
        </div>
        {errors.userId && <Body className="mt-1 text-sm text-red-500">{errors.userId}</Body>}
      </div>

      <div className="w-full">
        <PhoneInput
          label="Mobile number"
          value={mobileNumber}
          onChange={(v) => { setMobileNumber(v); setErrors((p) => ({ ...p, mobileNumber: "" })); }}
          disabled={loading}
          defaultCountry="IN"
          inputClassName="signup-phone-input"
          labelClassName="mb-1.5 block text-[14px] text-[#171717]"
        />
        {errors.mobileNumber && <Body className="mt-1 text-sm text-red-500">{errors.mobileNumber}</Body>}
      </div>

      <div className="w-full">
        <label htmlFor="password" className="mb-1.5 block text-[14px] text-[#171717]">Password</label>
        <div className={fieldClass(!!errors.password)}>
          <IoLockClosedOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-[#c8c8c8]" />
          <input id="password" name="password" type={showPassword ? "text" : "password"} value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
            autoComplete="new-password" disabled={loading} placeholder="Create a password"
            className={`${inputClass} pr-14`} />
          <button type="button" onClick={() => setShowPassword((p) => !p)} disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[19px] text-[#6f6f6f] transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50">
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.password ? (
          <Body className="mt-1 text-sm text-red-500">{errors.password}</Body>
        ) : (
          <Body className="mt-1 text-xs text-[#6f6f6f]">At least 8 characters, with upper, lower, a number, and one of . @ $ ! % * # ? &amp;</Body>
        )}
      </div>

      <div className="w-full">
        <label htmlFor="confirmPassword" className="mb-1.5 block text-[14px] text-[#171717]">Confirm password</label>
        <div className={fieldClass(!!errors.confirmPassword)}>
          <IoLockClosedOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-[#c8c8c8]" />
          <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
            autoComplete="new-password" disabled={loading} placeholder="Re-enter your password"
            className={`${inputClass} pr-14`} />
          <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} disabled={loading}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[19px] text-[#6f6f6f] transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50">
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.confirmPassword && <Body className="mt-1 text-sm text-red-500">{errors.confirmPassword}</Body>}
      </div>

      {formError && <Body className="text-sm text-red-500 text-center">{formError}</Body>}

      <Button type="submit" disabled={loading}
        className="mt-1 h-11 rounded-[8px] bg-[#c8ff32] text-[16px] font-bold text-black transition hover:bg-[#bafa20]">
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 items-center justify-center px-4 py-6">
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
          <div className="mt-5 text-center">
            <Link href="/login" className="text-[16px] text-[#6f6f6f] transition hover:text-black hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
