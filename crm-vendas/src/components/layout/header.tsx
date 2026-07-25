"use client";

import { useCRMStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Command, Sun, Moon, Bell, Menu } from "lucide-react";

export function Header() {
  const theme = useCRMStore((s) => s.theme);
  const toggleTheme = useCRMStore((s) => s.toggleTheme);
  const sidebarOpen = useCRMStore((s) => s.sidebarOpen);
  const toggleSidebar = useCRMStore((s) => s.toggleSidebar);
  const unreadCount = useCRMStore((s) => s.getUnreadCount());

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md transition-all duration-300",
        sidebarOpen ? "pl-[268px]" : "pl-[80px]"
      )}
    >
      <button
        onClick={toggleSidebar}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Menu className="size-4" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Command className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-ring focus:bg-background"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground"
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        <div className="ml-2 flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            CS
          </div>
        </div>
      </div>
    </header>
  );
}
