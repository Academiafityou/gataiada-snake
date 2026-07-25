"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useCRMStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CRMLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useCRMStore((s) => s.sidebarOpen);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          sidebarOpen ? "ml-[260px]" : "ml-[72px]"
        )}
      >
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
