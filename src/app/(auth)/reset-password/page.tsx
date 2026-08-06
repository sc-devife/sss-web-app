"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IoLockClosedOutline } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { isValidPassword, validationMessages } from "@/lib/validators";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(undefined);

    if (!isValidPassword(newPassword)) {
      setPasswordError(validationMessages.password);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords don't match");
      return;
    }
    setPasswordError(undefined);
    setLoading(true);
    try {
      await clientApi.post("/auth/reset-password", { email, token, newPassword });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setFormError(extractErrorMessage(err, "This reset link is invalid or has expired"));
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <Body className="text-center text-[16px] text-red-500">
        This reset link is missing required information. Please request a new one from the{" "}
        <Link href="/forgot-password" className="underline">forgot password</Link> page.
      </Body>
    );
  }

  if (done) {
    return (
      <Body className="text-center text-[16px] text-black">
        Password reset — redirecting you to sign in…
      </Body>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="w-full">
        <label htmlFor="newPassword" className="mb-2 block text-[16px] text-[#171717]">
          New password
        </label>
        <div className={`relative ${passwordError ? "rounded-[10px] ring-1 ring-red-500" : ""}`}>
          <IoLockClosedOutline
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
          />
          <input
            id="newPassword"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(undefined); setFormError(undefined); }}
            autoComplete="new-password"
            placeholder="Enter a new password"
            disabled={loading}
            className="h-[50px] w-full rounded-[10px] border border-[#c8c8c8] bg-transparent px-14 pr-14 text-[16px] text-black outline-none transition placeholder:text-[#aaa] focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[21px] text-[#6f6f6f] transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {passwordError && <Body className="mt-1 text-sm text-red-500">{passwordError}</Body>}
      </div>

      <div className="w-full">
        <label htmlFor="confirmPassword" className="mb-2 block text-[16px] text-[#171717]">
          Confirm new password
        </label>
        <div className="relative">
          <IoLockClosedOutline
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
          />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setFormError(undefined); }}
            autoComplete="new-password"
            placeholder="Re-enter the new password"
            disabled={loading}
            className="h-[50px] w-full rounded-[10px] border border-[#c8c8c8] bg-transparent px-14 text-[16px] text-black outline-none transition placeholder:text-[#aaa] focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50"
          />
        </div>
      </div>

      {formError && <Body className="text-sm text-red-500 text-center">{formError}</Body>}

      <Button
        type="submit"
        disabled={loading}
        className="mt-1 h-[48px] rounded-[8px] bg-[#c8ff32] text-[18px] font-bold text-black transition hover:bg-[#bafa20]"
      >
        {loading ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <Card className="w-full max-w-[520px] rounded-[16px] px-6 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:px-8 sm:py-8">
          <Heading as="h1" className="mb-2 text-center text-[26px] font-bold text-black">
            Reset your password
          </Heading>
          <Body muted className="mb-7 text-center text-[16px]">
            Choose a new password for your account.
          </Body>
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </main>
    </div>
  );
}
