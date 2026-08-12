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
import axios from "axios";
import { toast } from "react-toastify";
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
import { Alert } from "@/components/ui/Alert";
import {
  isValidEmail,
  validationMessages,
  isValidPassword,
} from "@/lib/validators";
import { clientApi } from "@/lib/axios/clientClient";
import { extractErrorMessage } from "@/lib/axios/extractErrorMessage";
import { useAppDispatch } from "@/store/hooks";
import { setLoggedInUser, type LoggedInUser } from "@/features/auth/authSlice";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

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
      const res = await clientApi.post<LoggedInUser>("/login", { email, password });
      dispatch(setLoggedInUser({
        userId: res.data.userId,
        name: res.data.name,
        role: res.data.role,
        organizationLogo: res.data.organizationLogo ?? null,
      }));

      toast.success("Login successful.");

      const destination =
        searchParams.get("from") ??
        "/dashboard";

      router.push(destination);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 503) {
          // Backend unreachable (stopped, connection refused, timed out) —
          // not a credentials problem, so a toast rather than the inline
          // form Alert.
          toast.error(extractErrorMessage(err, "Unable to connect to the server. Please try again later."));
        } else if (err.response.status === 401) {
          setFormError("Invalid email or password.");
        } else {
          // e.g. 403 blocked-account — a real backend message worth showing
          // inline, same treatment as invalid credentials.
          setFormError(extractErrorMessage(err, "Invalid email or password."));
        }
      } else {
        // No response at all (e.g. the Next.js server itself unreachable).
        toast.error("Unable to connect to the server. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[440px] rounded-2xl border-border/70 bg-card/95 px-6 py-8 shadow-xl shadow-primary/10 backdrop-blur sm:px-9 sm:py-9">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/50 p-2 shadow-sm">

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
        className="mb-2 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        Welcome Back
      </Heading>

      {/* Subtitle */}
      <Body
        muted
        className="mb-8 text-center text-sm leading-6"
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
              className="h-11 w-full rounded-xl border border-border bg-background px-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted"
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
            className="mb-2 block text-sm font-medium text-foreground"
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
              className="h-11 w-full rounded-xl border border-border bg-background px-12 pr-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted"
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
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Forgot Password */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary transition hover:text-primary/80 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Invalid credentials / account error */}
        {formError && (
          <Alert tone="danger" autoClose={false}>
            {formError}
          </Alert>
        )}

        {/* Sign In */}
        <Button
          type="submit"
          loading={loading}
          loadingText="Signing in…"
          className="mt-1 h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md"
        >
          Sign In
        </Button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 bg-primary/[0.035] lg:block" />
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full border border-accent/20 lg:block" />
      {/* Main Content */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
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
