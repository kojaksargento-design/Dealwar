import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Logo } from "@/components/dealwar/Logo";
import {
  Home,
  Swords,
  Plus,
  Trophy,
  User,
  Compass,
  Flame,
  Briefcase,
  Bell,
  LogOut,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const desktopNav = [
  { to: "/", label: "HOME", icon: Home },
  { to: "/wars", label: "EXPLORE", icon: Compass },
  { to: "/trending", label: "TRENDING", icon: Flame },
  { to: "/ranking", label: "RANKING", icon: Trophy },
  { to: "/business", label: "BUSINESS", icon: Briefcase },
  { to: "/profile", label: "PROFILE", icon: User },
];

const mobileNav = [
  { to: "/", label: "HOME", icon: Home },
  { to: "/wars", label: "WARS", icon: Swords },
  { to: "/create", label: "CREATE", icon: Plus, primary: true },
  { to: "/ranking", label: "RANKING", icon: Trophy },
  { to: "/profile", label: "PROFILE", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const notifications = useQuery(
    api.notifications.listMine,
    isAuthenticated ? {} : "skip",
  );
  const unread = notifications?.filter((n) => !n.read).length ?? 0;
  const markAllRead = useMutation(api.notifications.markAllRead);

  return (
    <div className="app-bg min-h-screen">
      <header className="glass-strong sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link to="/" aria-label="DEALWAR home">
              <Logo />
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {desktopNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="glass-subtle relative rounded-full p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
                  >
                    <Bell className="size-4" />
                    {unread > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-strong w-80">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Notifications
                    </span>
                    {unread > 0 && (
                      <button
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => markAllRead({})}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications && notifications.length === 0 && (
                    <p className="px-3 pb-3 text-sm text-muted-foreground">
                      No notifications yet.
                    </p>
                  )}
                  <div className="max-h-72 overflow-y-auto">
                    {notifications?.map((n) => (
                      <div
                        key={n._id}
                        className={cn(
                          "border-t border-white/40 px-3 py-2",
                          !n.read && "bg-primary/5",
                        )}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-muted-foreground">{n.body}</p>
                        )}
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="glass-subtle flex items-center gap-2 rounded-full py-1 pl-1 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Account menu"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-sm">
                      {user?.name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                    <Menu className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-strong">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 size-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Bell className="mr-2 size-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/owner")}>
                    <Activity className="mr-2 size-4" /> Owner dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate("/");
                    }}
                  >
                    <LogOut className="mr-2 size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="rounded-full font-bold"
                onClick={() => navigate("/auth?returnTo=%2F")}
              >
                Sign in
              </Button>
            )}

            <button
              className="glass-subtle rounded-full p-2 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile expanded menu */}
        {menuOpen && (
          <nav
            className="glass-strong border-t px-4 py-3 md:hidden"
            aria-label="Mobile menu"
          >
            <div className="flex flex-col gap-1">
              {desktopNav
                .filter((i) => !mobileNav.some((m) => m.to === i.to))
                .map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-primary/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                ))}
              <Link
                to="/missions"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-primary/10"
                onClick={() => setMenuOpen(false)}
              >
                <Flame className="size-4" /> MISSIONS
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-16">{children}</main>

      {/* Mobile bottom navigation */}
      <nav
        className="glass-strong fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl px-2 py-2 md:hidden"
        aria-label="Bottom navigation"
      >
        {mobileNav.map((item) =>
          item.primary ? (
            <Link
              key={item.to}
              to={item.to}
              className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30"
              aria-label={item.label}
            >
              <item.icon className="size-5" />
            </Link>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[9px] font-bold tracking-wide transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
              aria-label={item.label}
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
