"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Heading, Body } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { isValidEmail, validationMessages } from "@/lib/validators";
import { login } from "@/lib/api";

export default function LoginPage() {
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
      await login(email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
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
    </div>
  );
}
