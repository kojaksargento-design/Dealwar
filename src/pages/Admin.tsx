import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ShellPage } from "@/components/dealwar/ShellPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldAlert, Check, X, Star, Ban, Euro, Plus, Trophy } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { eur, timeAgo } from "@/lib/format";

export default function Admin() {
  const { isAuthenticated } = useAuth();

  // Client-safe admin check first. Admin-only queries below stay "skip"ped
  // until this returns true, so unauthorized users never trigger the
  // server-side "Admin access required." errors.
  const isAdmin = useQuery(api.gamification.isMyAdmin, isAuthenticated ? {} : "skip");
  const ready = isAuthenticated === true && isAdmin === true;

  const pending = useQuery(api.moderation.listPending, ready ? {} : "skip");
  const reports = useQuery(api.moderation.listReports, ready ? {} : "skip");
  const stores = useQuery(api.moderation.listStores, ready ? {} : "skip");
  const revenue = useQuery(api.moderation.revenueDashboard, ready ? {} : "skip");
  const analyticsCounts = useQuery(api.moderation.analytics, ready ? {} : "skip");
  const campaigns = useQuery(api.moderation.listCampaignsAdmin, ready ? {} : "skip");
  const wars = useQuery(api.moderation.listWarsAdmin, ready ? {} : "skip");
  const users = useQuery(api.moderation.listUsers, ready ? {} : "skip");
  const prizeClaims = useQuery(api.purchasePrize.listPendingAdmin, ready ? {} : "skip");

  const approve = useMutation(api.moderation.approveSubmission);
  const reject = useMutation(api.moderation.rejectSubmission);
  const moderateWar = useMutation(api.moderation.moderateWar);
  const suspend = useMutation(api.moderation.setUserSuspended);
  const resolveReport = useMutation(api.moderation.resolveReport);
  const createStore = useMutation(api.moderation.createStore);
  const approveClaim = useMutation(api.purchasePrize.approveClaim);
  const rejectClaim = useMutation(api.purchasePrize.rejectClaim);

  const [storeName, setStoreName] = useState("");
  const [storeSite, setStoreSite] = useState("");
  const [storeNetwork, setStoreNetwork] = useState("");
  const [storeAffUrl, setStoreAffUrl] = useState("");

  if (!isAuthenticated) {
    return (
      <ShellPage>
        <div className="glass rounded-3xl p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-3 text-xl font-black tracking-tight">Admin access required</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This area is restricted to platform administrators. If you believe
            you should have access, contact the team.
          </p>
          <Button className="mt-6 rounded-xl font-black" asChild>
            <Link to="/auth?returnTo=%2Fadmin">Sign in</Link>
          </Button>
        </div>
      </ShellPage>
    );
  }

  // Distinguish: still checking (undefined) vs checked-and-not-admin (false).
  if (isAuthenticated && isAdmin === undefined) {
    return (
      <ShellPage>
        <Skeleton className="h-96 rounded-3xl" />
      </ShellPage>
    );
  }

  if (!ready) {
    return (
      <ShellPage>
        <div className="glass rounded-3xl p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-3 text-xl font-black tracking-tight">Not authorized</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Your account does not have admin permissions. Admin access is
            granted server-side only.
          </p>
        </div>
      </ShellPage>
    );
  }

  async function handleApprove(id: string) {
    try {
      await approve({ submissionId: id as never });
      toast.success("Submission approved. XP awarded to the hunter.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve.");
    }
  }

  async function handleReject(id: string) {
    try {
      await reject({ submissionId: id as never, reason: "Rejected by moderator" });
      toast("Submission rejected.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject.");
    }
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createStore({
        name: storeName.trim(),
        website: storeSite.trim() || undefined,
        affiliateNetwork: storeNetwork.trim() || undefined,
        affiliateUrl: storeAffUrl.trim() || undefined,
      });
      toast.success("Store added.");
      setStoreName("");
      setStoreSite("");
      setStoreNetwork("");
      setStoreAffUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add store.");
    }
  }

  return (
    <ShellPage>
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            <ShieldAlert className="size-7 text-primary" /> Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Moderation, platform health and revenue. Every action is audit-logged.
          </p>
        </header>

        {/* revenue strip — REAL zeros until conversions exist */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Confirmed revenue", value: revenue ? eur(revenue.confirmedRevenue) : "—" },
            { label: "Pending revenue", value: revenue ? eur(revenue.pendingRevenue) : "—" },
            { label: "Estimated revenue", value: revenue ? eur(revenue.estimatedRevenue) : "—" },
            { label: "Affiliate clicks", value: revenue ? String(revenue.clicksTotal) : "—" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <Euro className="mx-auto size-4 text-primary" aria-hidden />
              <p className="mt-1 text-xl font-black tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </section>

        <Tabs defaultValue="submissions">
          <TabsList className="glass w-full justify-start overflow-x-auto rounded-2xl">
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="wars">Wars</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="prizes">Prémios</TabsTrigger>
            <TabsTrigger value="stores">Stores</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-4 flex flex-col gap-3">
            {pending === undefined && <Skeleton className="h-40 rounded-3xl" />}
            {pending?.length === 0 && (
              <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
                No submissions waiting. The moderation queue is clear.
              </p>
            )}
            {pending?.map((s) => (
              <article key={s._id} className="glass flex flex-wrap items-center gap-4 rounded-3xl p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {s.username} · {eur(s.price)} · {s.storeLabel}
                  </p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="block truncate text-xs text-primary hover:underline">
                    {s.url}
                  </a>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    War: {" "}
                    {s.warSlug ? (
                      <Link to={`/war/${s.warSlug}`} className="underline">
                        {s.warTitle}
                      </Link>
                    ) : (
                      <span>{s.warTitle}</span>
                    )}{" "}
                    · {timeAgo(s.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700" onClick={() => handleApprove(s._id)}>
                    <Check className="mr-1 size-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="glass rounded-xl font-bold" onClick={() => handleReject(s._id)}>
                    <X className="mr-1 size-4" /> Reject
                  </Button>
                </div>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="wars" className="mt-4 flex flex-col gap-3">
            {wars?.length === 0 && (
              <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
                No wars exist yet.
              </p>
            )}
            {wars?.map((w) => (
              <article key={w._id} className="glass flex flex-wrap items-center gap-4 rounded-3xl p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {w.title}{" "}
                    {w.isDemo && (
                      <span className="ml-1 rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                        DEMO
                      </span>
                    )}
                    {w.sponsored && (
                      <span className="ml-1 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-black text-amber-950">
                        SPONSORED
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {w.participants} hunters · best {eur(w.bestPrice)} ·{" "}
                    {w.status === "open" ? "open" : "ended"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {w.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass rounded-xl font-bold"
                      onClick={async () => {
                        await moderateWar({ warId: w._id as never, action: "end" });
                        toast("War ended.");
                      }}
                    >
                      <X className="mr-1 size-4" /> End
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass rounded-xl font-bold"
                    onClick={async () => {
                      await moderateWar({
                        warId: w._id as never,
                        action: w.featured ? "unfeature" : "feature",
                      });
                      toast(w.featured ? "Unfeatured." : "War featured.");
                    }}
                  >
                    <Star className="mr-1 size-4" /> {w.featured ? "Unfeature" : "Feature"}
                  </Button>
                </div>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="users" className="mt-4 flex flex-col gap-3">
            {users?.length === 0 && (
              <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
                No users yet.
              </p>
            )}
            {users?.map((u) => (
              <article key={u._id} className="glass flex flex-wrap items-center gap-4 rounded-3xl p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    @{u.username}{" "}
                    {u.isDemo && (
                      <span className="ml-1 rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                        DEMO
                      </span>
                    )}
                    {u.isAdmin && (
                      <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-black text-primary">
                        ADMIN
                      </span>
                    )}
                    {u.suspended && (
                      <span className="ml-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-black text-destructive">
                        SUSPENDED
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.xp} XP · {u.wins} wins · reputation {u.reputation}
                  </p>
                </div>
                {!u.isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={"glass rounded-xl font-bold"}
                    onClick={async () => {
                      try {
                        await suspend({ profileId: u._id as never, suspended: !u.suspended });
                        toast(u.suspended ? "User reinstated." : "User suspended.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Action failed.");
                      }
                    }}
                  >
                    <Ban className="mr-1 size-4" /> {u.suspended ? "Reinstate" : "Suspend"}
                  </Button>
                )}
              </article>
            ))}
          </TabsContent>

          <TabsContent value="reports" className="mt-4 flex flex-col gap-3">
            {reports?.length === 0 && (
              <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
                No open reports.
              </p>
            )}
            {reports?.map((r) => (
              <article key={r._id} className="glass flex flex-wrap items-center gap-4 rounded-3xl p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {r.targetType.replace(/_/g, " ")} reported
                  </p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-xl font-bold" onClick={() => resolveReport({ reportId: r._id as never, outcome: "resolved" })}>
                    Resolve
                  </Button>
                  <Button size="sm" variant="outline" className="glass rounded-xl font-bold" onClick={() => resolveReport({ reportId: r._id as never, outcome: "dismissed" })}>
                    Dismiss
                  </Button>
                </div>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="prizes" className="mt-4 flex flex-col gap-3">
            {prizeClaims?.length === 0 && (
              <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
                Sem reclamações de prémio de compra pendentes.
              </p>
            )}
            {prizeClaims?.map((c) => (
              <article key={c._id} className="glass flex flex-wrap items-center gap-4 rounded-3xl p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    🥇 {c.storeName}
                    {c.amountPaid ? ` · ${eur(c.amountPaid)}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <a
                      href={c.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary hover:underline"
                    >
                      ver comprovativo
                    </a>
                    {" · "}
                    {timeAgo(c.createdAt)}
                  </p>
                  {c.note && <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl font-bold"
                    onClick={async () => {
                      try {
                        await approveClaim({ claimId: c._id as never });
                        toast("Prémio aprovado: emblema Vitória + 250 XP atribuídos.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Erro.");
                      }
                    }}
                  >
                    <Trophy className="mr-1 size-4" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass rounded-xl font-bold"
                    onClick={async () => {
                      try {
                        await rejectClaim({ claimId: c._id as never });
                        toast("Reclamação recusada.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Erro.");
                      }
                    }}
                  >
                    <X className="mr-1 size-4" /> Recusar
                  </Button>
                </div>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="stores" className="mt-4 flex flex-col gap-3">
            <form onSubmit={handleCreateStore} className="glass flex flex-col gap-3 rounded-3xl p-5 sm:flex-row">
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store name" required maxLength={60} />
              <Input value={storeSite} onChange={(e) => setStoreSite(e.target.value)} type="url" placeholder="Website (optional — never invented)" />
              <Input value={storeNetwork} onChange={(e) => setStoreNetwork(e.target.value)} placeholder="Affiliate network (e.g. Awin)" maxLength={40} />
              <Input value={storeAffUrl} onChange={(e) => setStoreAffUrl(e.target.value)} type="url" placeholder="Affiliate link (from the network)" />
              <Button type="submit" className="rounded-xl font-bold">
                <Plus className="mr-1 size-4" /> Add store
              </Button>
            </form>
            {stores?.length === 0 && (
              <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
                No stores registered yet.
              </p>
            )}
            {stores?.map((st) => (
              <div key={st._id} className="glass-subtle flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
                <p className="text-sm font-bold">{st.name}</p>
                <span className="text-xs text-muted-foreground">{st.website ?? "no website"}</span>
                <Badge variant="secondary" className="ml-auto rounded-full">
                  {st.affiliateNetwork ?? "no affiliate network"}
                </Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <div className="glass rounded-3xl p-6">
              <h2 className="font-black tracking-tight">Platform events (last 7 days)</h2>
              {analyticsCounts === undefined && <Skeleton className="mt-4 h-32 rounded-2xl" />}
              {analyticsCounts && Object.keys(analyticsCounts).length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  No events recorded yet.
                </p>
              )}
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {analyticsCounts &&
                  Object.entries(analyticsCounts).map(([name, count]) => (
                    <li key={name} className="glass-subtle rounded-2xl p-3 text-center">
                      <p className="text-xl font-black">{count}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {name.replace(/_/g, " ")}
                      </p>
                    </li>
                  ))}
              </ul>
              {campaigns && campaigns.length > 0 && (
                <>
                  <h3 className="mt-6 font-black tracking-tight">Campaigns</h3>
                  <ul className="mt-2 flex flex-col gap-2">
                    {campaigns.map((c) => (
                      <li key={c._id} className="glass-subtle flex items-center justify-between rounded-2xl px-4 py-2 text-sm">
                        <span className="font-semibold">{c.name}</span>
                        <Badge variant="secondary" className="rounded-full uppercase">{c.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* actions legend */}
        <p className="text-xs text-muted-foreground">
          Admin actions available: <Star className="inline size-3" /> feature /{" "}
          <Ban className="inline size-3" /> suspend / verify / approve / reject —
          all recorded in the audit log.
        </p>
      </div>
    </ShellPage>
  );
}
