"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { IoMailOutline } from "react-icons/io5";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { isValidEmail, validationMessages } from "@/lib/validators";
import { clientApi } from "@/lib/axios/clientClient";

function ForgotPasswordForm() {
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
    <Card className="w-full max-w-[440px] rounded-2xl border-border/70 bg-card/95 px-6 py-8 shadow-xl shadow-primary/10 backdrop-blur sm:px-9 sm:py-9">
      {/* Logo */}
      <div className="mb-4 flex justify-center">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/50 p-2 shadow-sm">
          <img
            src="/logo.jpg"
            alt="Travel Online Agency"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Heading */}
      <Heading
        as="h1"
        className="mb-2 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        Forgot password?
      </Heading>

      {/* Subtitle */}
      <Body muted className="mb-8 text-center text-sm leading-6">
        Enter your registered email and we&apos;ll send you a reset link.
      </Body>

      {sent ? (
        <Body className="text-center text-sm text-foreground">
          If that email is registered, a reset link has been sent. Check your inbox.
        </Body>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="w-full">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Email Address
            </label>

            <div
              className={`relative ${emailError
                ? "rounded-[10px] ring-1 ring-red-500"
                : ""
                }`}
            >
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
                className="h-11 w-full rounded-xl border border-border bg-background px-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted"
              />
            </div>

            {emailError && (
              <Body className="mt-1 text-sm text-red-500">
                {emailError}
              </Body>
            )}
          </div>

          {/* Send */}
          <Button
            type="submit"
            loading={loading}
            loadingText="Sending…"
            className="mt-1 h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md"
          >
            Send reset link
          </Button>
        </form>
      )}

      {/* Back to sign in */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-primary transition hover:text-primary/80 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}

export default function ForgotPasswordPage() {
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

      {/* LOGIN CONTENT */}
      <main
        className="
            relative
            z-10
            flex
            flex-1
            items-center
            justify-center
            px-4
            py-8
            sm:px-6
          "
      >
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </main>

      {/* FOOTER */}
      <footer
        className="
            relative
            z-10
            pb-4
            text-center
            text-[14px]
            text-[#737373]
          "
      >
        © {new Date().getFullYear()} untitled UI Travel Operations.
        All rights reserved.
      </footer>
    </div>
  );
}
