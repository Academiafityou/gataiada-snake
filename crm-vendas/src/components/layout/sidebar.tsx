"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCRMStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { label: "Análises", href: "/analytics", icon: BarChart3 },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useCRMStore((s) => s.sidebarOpen);
  const toggleSidebar = useCRMStore((s) => s.toggleSidebar);
  const currentUser = useCRMStore((s) => s.currentUser);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-[260px]" : "w-[72px]"
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="size-4" />
        </div>
        {sidebarOpen && (
          <span className="truncate text-sm font-semibold tracking-tight">
            CRM Vendas
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                )}
              />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            !sidebarOpen && "justify-center px-0"
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{currentUser.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {currentUser.email}
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        {sidebarOpen ? (
          <ChevronsLeft className="size-3.5" />
        ) : (
          <ChevronsRight className="size-3.5" />
        )}
      </button>
    </aside>
  );
}
