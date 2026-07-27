"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IoMailOutline, IoLockClosedOutline, IoPersonOutline, IoCallOutline } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { isValidSignupPassword, isValidUserId, isValidPhone, validationMessages } from "@/lib/validators";

function fieldClass(hasError: boolean) {
  return `relative ${hasError ? "rounded-[10px] ring-1 ring-red-500" : ""}`;
}

const inputClass =
  "h-[50px] w-full rounded-[10px] border border-[#c8c8c8] bg-transparent px-14 text-[16px] text-black outline-none transition placeholder:text-[#aaa] focus:border-[#c8ff32] focus:ring-1 focus:ring-[#c8ff32] disabled:cursor-not-allowed disabled:bg-gray-50";

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
    if (!isValidPhone(mobileNumber)) nextErrors.mobileNumber = validationMessages.phone;
    if (!isValidSignupPassword(password)) nextErrors.password = validationMessages.signupPassword;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationToken,
          first_name: firstName,
          last_name: lastName,
          userId,
          email,
          mobileNumber,
          password,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to complete signup");
      }
      router.push("/login?signedUp=1");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to complete signup");
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="w-full">
        <label className="mb-2 block text-[16px] text-[#171717]">Email</label>
        <div className="relative">
          <IoMailOutline
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
          />
          <input value={email} disabled readOnly className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="w-full">
          <label htmlFor="firstName" className="mb-2 block text-[16px] text-[#171717]">First name</label>
          <div className={fieldClass(!!errors.firstName)}>
            <IoPersonOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]" />
            <input id="firstName" name="firstName" value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: "" })); }}
              disabled={loading} placeholder="First name" className={inputClass} />
          </div>
          {errors.firstName && <Body className="mt-1 text-sm text-red-500">{errors.firstName}</Body>}
        </div>
        <div className="w-full">
          <label htmlFor="lastName" className="mb-2 block text-[16px] text-[#171717]">Last name</label>
          <div className={fieldClass(!!errors.lastName)}>
            <IoPersonOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]" />
            <input id="lastName" name="lastName" value={lastName}
              onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: "" })); }}
              disabled={loading} placeholder="Last name" className={inputClass} />
          </div>
          {errors.lastName && <Body className="mt-1 text-sm text-red-500">{errors.lastName}</Body>}
        </div>
      </div>

      <div className="w-full">
        <label htmlFor="userId" className="mb-2 block text-[16px] text-[#171717]">User ID</label>
        <div className={fieldClass(!!errors.userId)}>
          <IoPersonOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]" />
          <input id="userId" name="userId" value={userId}
            onChange={(e) => { setUserId(e.target.value); setErrors((p) => ({ ...p, userId: "" })); }}
            disabled={loading} placeholder="Choose a user ID" className={inputClass} />
        </div>
        {errors.userId && <Body className="mt-1 text-sm text-red-500">{errors.userId}</Body>}
      </div>

      <div className="w-full">
        <label htmlFor="mobileNumber" className="mb-2 block text-[16px] text-[#171717]">Mobile number</label>
        <div className={fieldClass(!!errors.mobileNumber)}>
          <IoCallOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]" />
          <input id="mobileNumber" name="mobileNumber" value={mobileNumber}
            onChange={(e) => { setMobileNumber(e.target.value); setErrors((p) => ({ ...p, mobileNumber: "" })); }}
            disabled={loading} placeholder="10-digit mobile number" className={inputClass} />
        </div>
        {errors.mobileNumber && <Body className="mt-1 text-sm text-red-500">{errors.mobileNumber}</Body>}
      </div>

      <div className="w-full">
        <label htmlFor="password" className="mb-2 block text-[16px] text-[#171717]">Password</label>
        <div className={fieldClass(!!errors.password)}>
          <IoLockClosedOutline aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]" />
          <input id="password" name="password" type={showPassword ? "text" : "password"} value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
            autoComplete="new-password" disabled={loading} placeholder="Create a password"
            className={`${inputClass} pr-14`} />
          <button type="button" onClick={() => setShowPassword((p) => !p)} disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[21px] text-[#6f6f6f] transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50">
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {errors.password ? (
          <Body className="mt-1 text-sm text-red-500">{errors.password}</Body>
        ) : (
          <Body className="mt-1 text-sm text-[#6f6f6f]">At least 8 characters, with upper, lower, a number, and one of . @ $ ! % * # ? &amp;</Body>
        )}
      </div>

      {formError && <Body className="text-sm text-red-500 text-center">{formError}</Body>}

      <Button type="submit" disabled={loading}
        className="mt-1 h-[48px] rounded-[8px] bg-[#c8ff32] text-[18px] font-bold text-black transition hover:bg-[#bafa20]">
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
