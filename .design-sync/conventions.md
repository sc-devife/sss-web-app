# sss-web-app design system — build conventions

Tailwind utility-class system with semantic color tokens (CSS custom properties, HSL triplets) mapped through `tailwind.config.ts`. No provider/wrapper needed — components read CSS variables and Tailwind classes directly; no theme context to set up.

## Styling idiom

Style with Tailwind utility classes using this DS's semantic color names — never raw Tailwind palette colors (`bg-blue-500`, `text-gray-600`, etc.) or arbitrary hex values. Every component composes from this family:

| Purpose | Classes |
|---|---|
| Surfaces | `bg-background`, `bg-card`, `bg-muted` |
| Text | `text-foreground` (default), `text-muted-foreground` (secondary/caption), `text-card-foreground` |
| Brand | `bg-primary` / `text-primary-foreground`, `bg-accent` / `text-accent-foreground` |
| Status | `bg-success`/`text-success`, `bg-warning`/`text-warning`, `bg-danger`/`text-danger` — always pair with a light-opacity background for pills/badges, e.g. `bg-success/15 text-success` (see `Badge`'s `toneClasses`), never a solid fill for status text |
| Borders | `border-border` |
| Radius | plain `rounded` (6px, the DS default) for dense/compact UI; `rounded-2xl` only for the opt-in "elevated" look (see `Card`'s `variant="elevated"`) |

All color utilities support Tailwind's alpha-modifier syntax (`bg-primary/90`, `bg-danger/15`) because tokens are defined as bare HSL triplets, not wrapped in `hsl()`. Font families: `font-sans` (UI text, default) and `font-mono` — both indirect via `var(--font-sans)`/`var(--font-mono)`, do not hardcode font names.

Dark mode is class-based (`.dark` on an ancestor) — every token has a dark override already defined; components never need conditional dark-mode classes themselves.

## Where the truth lives

Token definitions: `_ds/styles.css` (compiled — the raw source counterpart in this repo is `src/app/globals.css`, generated from Tailwind's `@tailwind` directives, so read the compiled version for the actual token values). Per-component styling: read each component's own source directly (composed inline via `cn()`, no separate stylesheet per component) — e.g. `components/general/Button/Button.jsx` for the variant/size class maps.

## Example composition

```tsx
import { Card, Heading, Body, Badge } from "sss-web-app";

<Card variant="elevated">
  <div className="flex items-start justify-between">
    <div>
      <Heading as="h3">Netravati escape</Heading>
      <Body muted>Sangmesh Rao · Sep 5–7, 2026</Body>
    </div>
    <Badge tone="warning">Planning</Badge>
  </div>
</Card>
```
