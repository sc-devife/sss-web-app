import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

// Auth guard (redirect unauthenticated visitors to /login) lands with the
// real session-handling work — this scaffold only provides the shell.
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
