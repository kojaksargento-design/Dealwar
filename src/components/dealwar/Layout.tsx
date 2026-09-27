import { AppShell } from "@/components/dealwar/AppShell";
import { Outlet } from "react-router";

/**
 * Shared layout for all in-app pages (everything except the public landing
 * page and the auth screen). Provides glass top bar, notifications and the
 * mobile bottom navigation.
 */
export function Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
