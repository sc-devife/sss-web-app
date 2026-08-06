"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { IoMailOutline } from "react-icons/io5";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { isValidEmail, validationMessages } from "@/lib/validators";
import { clientApi } from "@/lib/axios/clientClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setEmailError(validationMessages.email);
      return;
    }
    setEmailError(undefined);
    setLoading(true);
    try {
      await clientApi.post("/auth/forgot-password", { email });
      // Always show the same success state, whether or not the email is
      // registered — the backend deliberately doesn't reveal which.
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <Card className="w-full max-w-[520px] rounded-[16px] px-6 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:px-8 sm:py-8">
          <Heading as="h1" className="mb-2 text-center text-[26px] font-bold text-black">
            Forgot password?
          </Heading>
          <Body muted className="mb-7 text-center text-[16px]">
            Enter your registered email and we&apos;ll send you a reset link.
          </Body>

          {sent ? (
            <Body className="text-center text-[16px] text-black">
              If that email is registered, a reset link has been sent. Check your inbox.
            </Body>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="w-full">
                <label htmlFor="email" className="mb-2 block text-[16px] text-[#171717]">
                  Email Address
                </label>
                <div className={`relative ${emailError ? "rounded-[10px] ring-1 ring-red-500" : ""}`}>
                  <IoMailOutline
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(undefined);
                    }}
                    autoComplete="username"
                    placeholder="Enter your email"
                    disabled={loading}
                    className="h-[50px] w-full rounded-[10px] border border-[#c8c8c8] bg-transparent px-14 text-[16px] text-black outline-none transition placeholder:text-[#aaa] focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50"
                  />
                </div>
                {emailError && <Body className="mt-1 text-sm text-red-500">{emailError}</Body>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="mt-1 h-[48px] rounded-[8px] bg-[#c8ff32] text-[18px] font-bold text-black transition hover:bg-[#bafa20]"
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link href="/login" className="text-[16px] text-[#6f6f6f] transition hover:text-black hover:underline">
              Back to sign in
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
