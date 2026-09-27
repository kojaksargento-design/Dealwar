import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Wars = lazy(() => import("./pages/Wars.tsx"));
const WarDetail = lazy(() => import("./pages/WarDetail.tsx"));
const CreateWar = lazy(() => import("./pages/CreateWar.tsx"));
const Ranking = lazy(() => import("./pages/Ranking.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Missions = lazy(() => import("./pages/Missions.tsx"));
const Trending = lazy(() => import("./pages/Trending.tsx"));
const Business = lazy(() => import("./pages/Business.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Owner = lazy(() => import("./pages/Owner.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Layout = lazy(() => import("@/components/dealwar/Layout.tsx").then((m) => ({ default: m.Layout })));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="app-bg flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-sm font-semibold text-muted-foreground">
        Loading…
      </div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="app-bg flex min-h-screen items-center justify-center p-6 text-foreground">
          <div className="glass max-w-lg rounded-3xl p-6 text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 max-h-40 overflow-auto rounded border border-white/50 p-2 text-left text-[10px] leading-4 text-muted-foreground/80">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Clear error if the Convex URL is missing (e.g. env var not set on a host).
const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "VITE_CONVEX_URL não está definida. Na Vercel: Settings → Environment Variables → adiciona a URL do teu deployment Convex.",
  );
}
const convex = new ConvexReactClient(convexUrl);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/wars" />}
              />

              {/* Public pages */}
              <Route element={<Layout />}>
                <Route path="/wars" element={<Wars />} />
                <Route path="/war/:slug" element={<WarDetail />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/ranking" element={<Ranking />} />

                {/* Protected pages */}
                <Route
                  path="/create"
                  element={
                    <RequireAuth>
                      <CreateWar />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/missions"
                  element={
                    <RequireAuth>
                      <Missions />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/business"
                  element={
                    <RequireAuth>
                      <Business />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/business/campaigns"
                  element={
                    <RequireAuth>
                      <Business />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RequireAuth>
                      <Settings />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <Admin />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/owner"
                  element={
                    <RequireAuth>
                      <Owner />
                    </RequireAuth>
                  }
                />
              </Route>

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
