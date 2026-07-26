import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Travel CRM",
  description: "Multi-tenant CRM for travel planning organizations",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased h-screen flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
