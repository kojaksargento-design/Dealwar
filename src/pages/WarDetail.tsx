import { useQuery, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ShareDialog } from "@/components/dealwar/ShareDialog";
import { PriceHistory } from "@/components/dealwar/PriceHistory";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Flag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/dealwar/EmptyState";
import { useAuth } from "@/hooks/use-auth";
import { eur, timeLeft, timeAgo } from "@/lib/format";
import {
  Users,
  Clock,
  TrendingDown,
  Loader2,
  Crosshair,
  Crown,
  Link2,
  Store,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

/**
 * Affiliate offers for this war's product. Hidden entirely when no store has
 * a configured affiliate link — never shown as fake buttons (honesty rule).
 * Each click is tracked server-side before opening the store.
 */
function AffiliateOffers({ warId }: { warId: string }) {
  const offers = useQuery(api.sharing.listOffers, { warId: warId as never });
  const trackClick = useMutation(api.sharing.trackAffiliateClick);

  if (offers === undefined || offers.length === 0) return null;

  return (
    <section className="glass rounded-3xl p-6">
      <h2 className="flex items-center gap-2 text-lg font-black tracking-tight">
        <Store className="size-5 text-primary" /> Onde comprar
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Links de parceiros — o DEALWAR pode receber comissão. Não altera o preço
        que pagas.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {offers.map((o) => (
          <Button
            key={o.storeId}
            size="sm"
            variant="outline"
            className="glass rounded-xl font-bold"
            onClick={async () => {
              try {
                await trackClick({ warId: warId as never, storeId: o.storeId as never });
              } catch {
                /* tracking is best-effort; never block the navigation */
              }
              window.open(o.affiliateUrl, "_blank", "noopener,noreferrer");
            }}
          >
            {o.name}
            <ExternalLink className="ml-1.5 size-3.5" />
          </Button>
        ))}
      </div>
    </section>
  );
}

export default function WarDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const war = useQuery(
    api.wars.getBySlug,
    slug ? { slug } : "skip",
  );
  const history = useQuery(
    api.wars.getPriceHistory,
    war ? { warId: war._id } : "skip",
  );
  const submissions = useQuery(
    api.wars.listSubmissions,
    war ? { warId: war._id } : "skip",
  );
  const ranking = useQuery(
    api.wars.warRanking,
    war ? { warId: war._id } : "skip",
  );
  const myProfile = useQuery(
    api.gamification.getMyProfile,
    isAuthenticated ? {} : "skip",
  );

  const submitPrice = useMutation(api.wars.submitPrice);
  const join = useMutation(api.wars.join);
  const touchStreak = useMutation(api.users.touchStreak);
  const trackEvent = useMutation(api.analytics.track);
  const recordShare = useMutation(api.sharing.recordShare);
  const submitReport = useMutation(api.moderation.submitReport);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [priceStr, setPriceStr] = useState("");
  const [storeName, setStoreName] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  if (war === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }
  if (war === null) {
    return (
      <EmptyState
        title="War not found."
        description="This Price War does not exist or has been removed."
        cta="Explore open wars"
        ctaTo="/wars"
      />
    );
  }

  const saved = Math.max(0, war.originalPrice - war.bestPrice);
  const ended = war.status !== "open";
  const price = parseFloat(priceStr.replace(",", "."));
  const priceValid = Number.isFinite(price) && price > 0 && price < war.bestPrice;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!war) return;
    setSending(true);
    try {
      await submitPrice({
        warId: war._id,
        price: Math.round(price * 100),
        storeName: storeName.trim() || undefined,
        url: url.trim(),
        notes: notes.trim() || undefined,
      });
      await touchStreak({});
      toast.success("Submission sent — pending verification.", {
        description: "A moderator will verify your price. You'll get +50 XP when approved.",
      });
      setFormOpen(false);
      setPriceStr("");
      setStoreName("");
      setUrl("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit price.");
    } finally {
      setSending(false);
    }
  }

  async function handleJoin() {
    if (!war) return;
    try {
      await join({ warId: war._id });
      await touchStreak({});
      toast.success("You joined the war! +5 XP");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not join war.");
    }
  }

  // Track a real page view once per mounted war (not on submit).
  useEffect(() => {
    if (war) {
      void trackEvent({ name: "war_view", warId: war._id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [war?._id]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <article className="glass-strong rounded-3xl p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {war.sponsored && (
            <Badge className="rounded-full bg-amber-400/90 text-amber-950">
              SPONSORED
            </Badge>
          )}
          {war.demo && (
            <Badge variant="outline" className="rounded-full border-dashed text-muted-foreground">
              DEMO
            </Badge>
          )}
          <Badge variant="secondary" className="rounded-full">
            {war.categoryEmoji} {war.categoryLabel}
          </Badge>
          {ended && <Badge variant="secondary" className="rounded-full">ENDED</Badge>}
        </div>

        <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
          {war.title}
        </h1>
        {war.description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {war.description}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Starting price</p>
            <p className="text-lg font-bold line-through">{eur(war.originalPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Best verified</p>
            <p className="text-2xl font-black tracking-tighter text-emerald-600">
              {eur(war.bestPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saved</p>
            <p className="flex items-center gap-1 text-lg font-bold text-emerald-600">
              <TrendingDown className="size-4" />
              {saved > 0 ? eur(saved) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time left</p>
            <p className="flex items-center gap-1 text-lg font-bold">
              <Clock className="size-4 text-muted-foreground" />
              {ended ? "Ended" : timeLeft(war.endTime)}
            </p>
          </div>
        </div>

        <Progress
          value={war.originalPrice > 0 ? (saved / war.originalPrice) * 100 : 0}
          className="mt-4 h-2"
          aria-label="Price drop progress"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" /> {war.participants}{" "}
            {war.participants === 1 ? "hunter" : "hunters"}
          </span>
          <span className="text-sm text-muted-foreground">
            by @{war.creatorUsername}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            {isAuthenticated && (
              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-muted-foreground"
                    aria-label="Report this war"
                  >
                    <Flag className="mr-1.5 size-3.5" /> Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong rounded-3xl border-white/60 sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Report this war</DialogTitle>
                    <DialogDescription>
                      Fake prices, wrong product, spam — tell the moderators
                      what's wrong. Reports go to the admin review queue.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await submitReport({
                          targetType: "war",
                          targetId: war._id,
                          reason: reportReason,
                        });
                        toast.success("Report submitted for moderation.");
                        setReportOpen(false);
                        setReportReason("");
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Could not submit report.",
                        );
                      }
                    }}
                  >
                    <Textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      rows={3}
                      required
                      minLength={4}
                      maxLength={400}
                      placeholder="Describe the problem (4–400 characters)…"
                      aria-label="Report reason"
                    />
                    <Button type="submit" className="mt-3 w-full rounded-xl font-bold">
                      Submit report
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {war.bestPrice < war.originalPrice && (
              <ShareDialog
                warTitle={war.title}
                originalPrice={war.originalPrice}
                bestPrice={war.bestPrice}
                slug={war.slug}
                onShared={async (channel) => {
                  if (isAuthenticated) {
                    await recordShare({ warId: war._id, channel });
                    await touchStreak({});
                  }
                }}
                trigger={
                  <Button variant="outline" className="glass rounded-xl font-bold">
                    <Link2 className="mr-2 size-4" /> SHARE CARD
                  </Button>
                }
              />
            )}
            {!ended &&
              (isAuthenticated ? (
                <>
                  <Button
                    variant="outline"
                    className="glass rounded-xl font-black tracking-wide"
                    onClick={handleJoin}
                  >
                    JOIN WAR
                  </Button>
                  <Button
                    className="rounded-xl font-black tracking-wide"
                    onClick={() => setFormOpen((v) => !v)}
                  >
                    <Crosshair className="mr-2 size-4" />
                    {formOpen ? "CLOSE FORM" : "BEAT THIS PRICE"}
                  </Button>
                </>
              ) : (
                <Button
                  className="rounded-xl font-black tracking-wide"
                  onClick={handleJoin}
                >
                  JOIN WAR
                </Button>
              ))}
          </div>
        </div>
      </article>

      <AffiliateOffers warId={war._id} />

      {/* Submit form */}
      {formOpen && isAuthenticated && (
        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6">
          <h2 className="font-black tracking-tight">Found a lower price?</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Submissions always start as PENDING VERIFICATION. You earn XP when a
            moderator verifies it.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Price found (€)
              </label>
              <Input
                id="price"
                inputMode="decimal"
                placeholder={eur(war.bestPrice - 100)}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                required
                className="mt-1"
              />
              {priceStr && !priceValid && (
                <p className="mt-1 text-xs text-destructive">
                  Must be a positive number lower than {eur(war.bestPrice)}.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="store" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Store
              </label>
              <Input
                id="store"
                placeholder="e.g. TechStore PT"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="url" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Product URL
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://store.example.com/product"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Observations (optional)
              </label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Shipping costs, promo code used, stock status…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="mt-4 w-full rounded-xl font-black tracking-wide"
            disabled={sending || !priceValid || url.length < 8}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Submitting…
              </>
            ) : (
              "SUBMIT FOR VERIFICATION"
            )}
          </Button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* left: history */}
        <section className="glass rounded-3xl p-6 lg:col-span-3">
          <h2 className="font-black tracking-tight">Price history</h2>
          <div className="mt-4">
            {history === undefined ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : (
              <PriceHistory entries={history} />
            )}
          </div>
        </section>

        {/* right: ranking */}
        <section className="glass rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-black tracking-tight">War ranking</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Approved submissions only.
          </p>
          {ranking !== undefined && ranking.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No verified prices yet. Submit yours and lead this war.
            </p>
          )}
          <ol className="mt-3 flex flex-col">
            {ranking?.slice(0, 10).map((r) => (
              <li
                key={r.profileId}
                className="flex items-center gap-3 border-b border-white/40 px-1 py-2.5 last:border-0"
              >
                <span
                  className={
                    r.rank === 1
                      ? "flex size-7 items-center justify-center rounded-lg bg-amber-400/90 text-xs font-black text-amber-950"
                      : "flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary"
                  }
                >
                  {r.rank}
                </span>
                {r.rank === 1 && <Crown className="size-4 text-amber-500" />}
                <span className="font-bold">{r.username}</span>
                <span className="ml-auto text-sm font-black text-emerald-600">
                  {eur(r.bestPrice)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* discoveries */}
      <section className="glass rounded-3xl p-6">
        <h2 className="font-black tracking-tight">Discoveries</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Recent price submissions. Pending ones are clearly marked and not
          verified yet.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {submissions !== undefined && submissions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No discoveries yet — be the first to post a lower price.
            </p>
          )}
          {submissions?.map((s) => (
            <div
              key={s._id}
              className="glass-subtle flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
            >
              <span className="text-xl" aria-hidden>{s.avatarEmoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {s.username}{" "}
                  <span className="font-normal text-muted-foreground">
                    found {eur(s.price)} at {s.storeLabel}
                  </span>
                </p>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex max-w-xs items-center gap-1 truncate text-xs text-primary hover:underline"
                >
                  <Store className="size-3 shrink-0" /> {s.url}
                </a>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(s.createdAt)}
                </span>
                {s.status === "approved" && (
                  <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">
                    VERIFIED
                  </Badge>
                )}
                {s.status === "pending" && (
                  <Badge variant="outline" className="rounded-full">
                    PENDING VERIFICATION
                  </Badge>
                )}
                {s.status === "rejected" && (
                  <Badge variant="secondary" className="rounded-full">
                    REJECTED
                  </Badge>
                )}
                {s.status === "validating" && (
                  <Badge variant="outline" className="rounded-full">
                    VALIDATING
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


