"use client";

import { createContext, useContext } from "react";

// The app's newer field look (introduced on the Escape / Quote screens): white
// pill-shaped fields with a soft shadow and a green hover border, instead of the
// older grey, square-cornered boxes. It is now the app-wide default: every shared field component (TextInput,
// Select, DatePicker, TimePicker, PhoneInput, MultiSelectSearch) reads it. A screen can
// still opt out with <FormAppearanceProvider value="default">.
export type FormAppearance = "default" | "pill";

const FormAppearanceContext = createContext<FormAppearance>("pill");

export const FormAppearanceProvider = FormAppearanceContext.Provider;

export function useFormAppearance(): FormAppearance {
  return useContext(FormAppearanceContext);
}

// Classes that turn a shared field box into the pill look. They come after the
// component's own base classes, so tailwind-merge lets them win.
export const PILL_FIELD = "h-9 rounded-full bg-card px-4 shadow-sm transition-colors hover:border-primary/40 disabled:bg-muted/50";

// Multi-line boxes can't be a full pill; they get big rounded corners instead.
export const PILL_AREA = "rounded-2xl bg-card px-4 py-2.5 shadow-sm transition-colors hover:border-primary/40";
