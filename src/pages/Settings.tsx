import { useAuth } from "@/hooks/use-auth";
import { ShellPage } from "@/components/dealwar/ShellPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Plug, Download, LogOut, ShieldCheck, Info } from "lucide-react";
import { Link, useNavigate } from "react-router";

function IntegrationRow({
  name,
  configured,
  description,
}: {
  name: string;
  configured: boolean;
  description: string;
}) {
  return (
    <div className="glass-subtle flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge
        className={
          configured
            ? "rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15"
            : "rounded-full bg-amber-400/20 text-amber-700 hover:bg-amber-400/20"
        }
      >
        {configured ? "Configured" : "Not configured"}
      </Badge>
    </div>
  );
}

export default function Settings() {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <ShellPage>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            <SettingsIcon className="size-7 text-primary" /> Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Account, integrations and platform information.
          </p>
        </header>

        {/* account */}
        <section className="glass rounded-3xl p-6">
          <h2 className="font-black tracking-tight">Account</h2>
          {isAuthenticated ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your hunter identity in your profile.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild className="rounded-xl font-bold">
                  <Link to="/profile">Open profile</Link>
                </Button>
                <Button
                  variant="outline"
                  className="glass rounded-xl font-bold"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                You are browsing as a guest. Sign in to join wars and earn XP.
              </p>
              <Button asChild className="mt-4 rounded-xl font-bold">
                <Link to="/auth?returnTo=%2Fsettings">Sign in</Link>
              </Button>
            </>
          )}
        </section>

        {/* integrations — honest status only */}
        <section className="glass rounded-3xl p-6">
          <h2 className="flex items-center gap-2 font-black tracking-tight">
            <Plug className="size-4 text-primary" /> Integrations
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The platform never simulates a connection. Unconfigured integrations
            are always shown as &ldquo;Not configured&rdquo;.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <IntegrationRow
              name="Affiliate network"
              configured={false}
              description="Affiliate links and conversion tracking architecture is ready. No network is connected, so revenue stays €0.00."
            />
            <IntegrationRow
              name="AI agents (Deal Hunter, Trend Hunter, …)"
              configured={false}
              description="AI module interfaces are prepared. All agents are DISABLED until AI_API_KEY is configured."
            />
            <IntegrationRow
              name="Payments"
              configured={false}
              description="No real payments in V1. Sponsored and premium revenue start at €0.00."
            />
            <IntegrationRow
              name="Google OAuth"
              configured={false}
              description="Email sign-in works today. Google sign-in can be enabled with provider credentials."
            />
          </div>
        </section>

        {/* PWA */}
        <section className="glass rounded-3xl p-6">
          <h2 className="flex items-center gap-2 font-black tracking-tight">
            <Download className="size-4 text-primary" /> Install as app
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            DEALWAR is a PWA. On your phone, open the browser menu and choose
            &ldquo;Add to Home Screen&rdquo; for a full-screen experience.
          </p>
        </section>

        {/* transparency */}
        <section className="glass rounded-3xl p-6">
          <h2 className="flex items-center gap-2 font-black tracking-tight">
            <ShieldCheck className="size-4 text-primary" /> Data transparency
          </h2>
          <div className="glass-subtle mt-3 flex items-start gap-2 rounded-2xl p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            XP and points are virtual — they never represent money. Revenue
            metrics only reflect real, confirmed conversions and start at
            €0.00. DEMO content is always labelled and never mixed with real
            data.
          </div>
          <Separator className="my-4 bg-white/50" />
          <p className="text-xs text-muted-foreground">
            Moderation: every price submission is reviewed by a human moderator
            before it counts. Report anything suspicious with the report
            actions on each war.
          </p>
        </section>
      </div>
    </ShellPage>
  );
}
