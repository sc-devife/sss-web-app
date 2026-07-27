"use client";

import {
  Suspense,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  IoMailOutline,
  IoLockClosedOutline,
} from "react-icons/io5";
import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import { Card } from "@/components/ui/Card";
import {
  Heading,
  Body,
} from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import {
  isValidEmail,
  validationMessages,
  isValidPassword,
} from "@/lib/validators";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [emailError, setEmailError] = useState<
    string | undefined
  >();
  const [passwordError, setPasswordError] = useState<
    string | undefined
  >();

  const [formError, setFormError] = useState<
    string | undefined
  >();

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setFormError(undefined);

    // Validate Email
    if (!isValidEmail(email)) {
      setEmailError(
        validationMessages.email,
      );
      return;
    }

    setEmailError(undefined);

    // Validate Password
    if (!isValidPassword(password)) {
      setPasswordError(
        validationMessages.password,
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!res.ok) {
        const body = await res
          .json()
          .catch(() => null);

        throw new Error(
          body?.message ??
          "Invalid credentials",
        );
      }

      const destination =
        searchParams.get("from") ??
        "/dashboard";

      router.push(destination);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Login failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[520px] rounded-[16px] px-6 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] sm:px-8 sm:py-8">
      {/* Logo */}
      <div className="mb-5 flex justify-center">
        <div className="flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-[10px] bg-[#c8dcff]">
          <img
            src="/logo.png"
            alt="Travel Online Agency"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Heading */}
      <Heading
        as="h1"
        className="mb-2 text-center text-[26px] font-bold text-black"
      >
        Welcome Back
      </Heading>

      {/* Subtitle */}
      <Body
        muted
        className="mb-7 text-center text-[16px]"
      >
        Sign in to access your workspace.
      </Body>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {/* Email */}
        <div className="w-full">
          <label
            htmlFor="email"
            className="mb-2 block text-[16px] text-[#171717]"
          >
            Email Address
          </label>

          <div
            className={`relative ${emailError
              ? "rounded-[10px] ring-1 ring-red-500"
              : ""
              }`}
          >
            {/* Email Icon */}
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
                setFormError(undefined);
              }}
              autoComplete="username"
              placeholder="Enter your email"
              disabled={loading}
              className="h-[50px] w-full rounded-[10px] border border-[#c8c8c8] bg-transparent px-14 text-[16px] text-black outline-none transition placeholder:text-[#aaa] focus:border-[#c8ff32] focus:ring-1 focus:ring-[#c8ff32] disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>

          {/* Email Error */}
          {emailError && (
            <Body className="mt-1 text-sm text-red-500">
              {emailError}
            </Body>
          )}
        </div>

        {/* Password */}
        <div className="w-full">
          <label
            htmlFor="password"
            className="mb-2 block text-[16px] text-[#171717]"
          >
            Password
          </label>

          <div
            className={`relative ${passwordError
              ? "rounded-[10px] ring-1 ring-red-500"
              : ""
              }`}
          >
            {/* Password Icon */}
            <IoLockClosedOutline
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[24px] text-[#c8c8c8]"
            />

            <input
              id="password"
              name="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(undefined);
                setFormError(undefined);
              }}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={loading}
              className="h-[50px] w-full rounded-[10px] border border-[#c8c8c8] bg-transparent px-14 pr-14 text-[16px] text-black outline-none transition placeholder:text-[#aaa] focus:border-[#c8ff32] focus:ring-1 focus:ring-[#c8ff32] disabled:cursor-not-allowed disabled:bg-gray-50"
            />

            {/* Password Visibility */}
            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (previous) => !previous,
                )
              }
              disabled={loading}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[21px] text-[#6f6f6f] transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showPassword ? (
                <FaEyeSlash />
              ) : (
                <FaEye />
              )}
            </button>
          </div>
          {/* Password Error */}
          {passwordError && (
            <Body className="mt-1 text-sm text-red-500">
              {passwordError}
            </Body>
          )}
        </div>

        {/* Form Error */}
        {formError && (
          <Body className="text-sm text-red-500 text-center">
            {formError}
          </Body>
        )}

        {/* Forgot Password */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[16px] text-[#6f6f6f] transition hover:text-black hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In */}
        <Button
          type="submit"
          disabled={loading}
          className="mt-1 h-[48px] rounded-[8px] bg-[#c8ff32] text-[18px] font-bold text-black transition hover:bg-[#bafa20]"
        >
          {loading
            ? "Signing in…"
            : "Sign In"}
        </Button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="pb-4 text-center text-[14px] text-[#737373]">
        © {new Date().getFullYear()} untitled UI
        Travel Operations. All rights reserved.
      </footer>
    </div>
  );
}