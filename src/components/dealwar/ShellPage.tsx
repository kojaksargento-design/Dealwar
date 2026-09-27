import { AppShell } from "@/components/dealwar/AppShell";
import type { ReactNode } from "react";

/** Wrap a page element in the app shell (used by single-element routes). */
export function ShellPage({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
