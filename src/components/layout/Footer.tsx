import pkg from "../../../package.json";

export function Footer() {
  return (
    <footer className="flex h-6 shrink-0 items-center justify-center border-t border-border bg-card text-[11px] text-muted-foreground">
      Travel CRM v{pkg.version}
    </footer>
  );
}
