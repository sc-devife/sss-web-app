"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { isValidEmail, validationMessages } from "@/lib/validators";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    if (!isValidEmail(email)) {
      setEmailError(validationMessages.email);
      return;
    }
    setEmailError(undefined);

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Invalid credentials");
      }
      const destination = searchParams.get("from") ?? "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <Heading as="h1" className="mb-1">
        Sign in
      </Heading>
      <Body muted className="mb-6">
        Travel Planner CRM
      </Body>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          autoComplete="username"
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {formError && <Body className="text-danger">{formError}</Body>}
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex h-full items-center justify-center bg-muted px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
