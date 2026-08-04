import type { ReactNode } from "react";
import { Heading, Body } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

// Per-page content header — distinct from the persistent app-shell Header
// (top bar with the hamburger/profile icon). This renders inside <main>,
// above a page's own content, and is what individual pages should use for
// "title + description + primary actions" consistently.
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between", className)}>
      <div>
        <Heading as="h1">{title}</Heading>
        {description && <Body muted className="mt-1">{description}</Body>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
