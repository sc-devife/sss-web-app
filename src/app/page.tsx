import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Heading, Body } from "@/components/ui/Typography";

export default function LandingPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-base font-semibold text-foreground">Travel CRM</span>
        <Link href="/login">
          <Button variant="secondary" size="sm">Log in</Button>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <Heading as="h1" className="max-w-xl text-3xl">
          Run your travel agency&apos;s leads, trips, and quotes in one place
        </Heading>
        <Body muted className="max-w-md">
          Travel Planner CRM helps agencies manage leads, build itineraries, send quotes, and track
          payments — built for teams like yours.
        </Body>
        <Link href="/login">
          <Button>Log in to your organization</Button>
        </Link>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center">
        <Body muted className="mx-auto">
          Access is by invitation only. Contact your organization&apos;s admin if you need an account.
        </Body>
      </footer>
    </div>
  );
}
