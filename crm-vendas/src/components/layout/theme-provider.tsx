"use client";

import { useEffect } from "react";
import { useCRMStore } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useCRMStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
