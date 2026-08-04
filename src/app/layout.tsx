import type { Metadata } from "next";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { StoreProvider } from "@/store/StoreProvider";

export const metadata: Metadata = {
  title: "Travel CRM",
  description: "Multi-tenant CRM for travel planning organizations",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased h-screen flex flex-col overflow-hidden">
        <StoreProvider>
          <div className="flex-1 min-h-0">{children}</div>
          <ToastContainer position="top-right" theme="colored" />
        </StoreProvider>
      </body>
    </html>
  );
}
