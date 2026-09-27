import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WarCard } from "@/components/dealwar/WarCard";
import { Logo } from "@/components/dealwar/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router";
import { Search, Swords, ArrowRight, Crosshair, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const STEPS = [
  { n: 1, title: "Find a product", desc: "Spot any product with a price worth beating." },
  { n: 2, title: "Start a War", desc: "Set the price to beat and open the battlefield." },
  { n: 3, title: "Beat the price", desc: "Hunters submit lower verified prices." },
  { n: 4, title: "Share your win", desc: "Generate your win card and challenge everyone." },
];

export default function Landing() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const openWars = useQuery(api.wars.listOpen, { limit: 6 });
  const trending = useQuery(api.wars.listTrending, { limit: 3 });
  const daily = useQuery(api.wars.getDailyWar, {});
  const topHunters = useQuery(api.ranking.ranking, { scope: "global", limit: 5 });

  // One-time demo seeding so a fresh deployment isn't empty. The seeder is
  // idempotent and no-ops as soon as any real war exists.
  const seedDemo = useMutation(api.demoSeed.seedDemoIfEmpty);
  useEffect(() => {
    if (openWars !== undefined && openWars.length === 0) {
      void seedDemo({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openWars !== undefined && openWars.length === 0]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    navigate(q.trim() ? `/wars?q=${encodeURIComponent(q.trim())}` : "/wars");
  }

  return (
    <div className="app-bg min-h-screen">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-xs font-bold tracking-wide text-muted-foreground md:flex">
            <Link to="/wars" className="hover:text-foreground">EXPLORE</Link>
            <Link to="/trending" className="hover:text-foreground">TRENDING</Link>
            <Link to="/ranking" className="hover:text-foreground">RANKING</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full font-semibold" asChild>
              <Link to="/auth?returnTo=%2Fprofile">Sign in</Link>
            </Button>
            <Button size="sm" className="rounded-full font-bold" asChild>
              <Link to="/auth?returnTo=%2Fcreate">CREATE WAR</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 md:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-primary"
          >
            <Crosshair className="size-3.5" /> The Price Battle
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-6 text-6xl font-black leading-none tracking-tighter md:text-8xl"
          >
            DEAL<span className="text-primary">WAR</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-4 text-lg font-semibold text-muted-foreground md:text-xl"
          >
            Find a deal. <span className="text-foreground">Beat the price.</span>{" "}
            <span className="text-primary">Win the war.</span>
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            onSubmit={search}
            className="glass mt-8 flex w-full max-w-xl items-center gap-2 rounded-2xl p-2"
            role="search"
          >
            <Search className="ml-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a product..."
              aria-label="Search a product"
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button type="submit" className="rounded-xl font-bold">Search</Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <Button size="lg" className="rounded-2xl px-8 font-black tracking-wide" asChild>
              <Link to="/wars">
                EXPLORE WARS <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="glass rounded-2xl px-8 font-black tracking-wide"
              asChild
            >
              <Link to="/auth?returnTo=%2Fcreate">
                <Swords className="mr-2 size-4" /> CREATE WAR
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="glass glass-hover rounded-3xl p-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                {s.n}
              </span>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daily war */}
      {daily && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-8">
            <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Daily War
            </span>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">
              ⚔️ Battle of the day
            </p>
            <h2 className="mt-2 max-w-lg text-2xl font-black tracking-tight md:text-3xl">
              {daily.title}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Original</p>
                <p className="text-xl font-black line-through">{(daily.originalPrice / 100).toFixed(2)}€</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best verified</p>
                <p className="text-3xl font-black tracking-tighter text-emerald-600">
                  {(daily.bestPrice / 100).toFixed(2)}€
                </p>
              </div>
              <Button className="ml-auto rounded-xl font-black tracking-wide" asChild>
                <Link to={`/war/${daily.slug}`}>BEAT THIS PRICE</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Live wars */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">LIVE WARS</h2>
          <Link to="/wars" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            See all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {openWars === undefined &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          {openWars?.length === 0 && (
            <div className="glass col-span-full rounded-3xl p-8 text-center">
              <p className="font-bold">No wars yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create the first Price War.
              </p>
              <Button className="mt-4 rounded-xl font-bold" asChild>
                <Link to="/auth?returnTo=%2Fcreate">CREATE WAR</Link>
              </Button>
            </div>
          )}
          {openWars?.map((w) => <WarCard key={w._id} war={w} compact />)}
        </div>
      </section>

      {/* Trending + Top hunters */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">TRENDING</h2>
            <Link to="/trending" className="text-sm font-bold text-primary hover:underline">
              More
            </Link>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {trending?.length === 0 && (
              <p className="glass rounded-2xl p-5 text-sm text-muted-foreground">
                No trending wars yet — activity will appear here as hunters join.
              </p>
            )}
            {trending?.map((w) => <WarCard key={w._id} war={w} compact />)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">TOP HUNTERS</h2>
            <Link to="/ranking" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              <Trophy className="size-4" /> Ranking
            </Link>
          </div>
          <div className="glass mt-5 rounded-3xl p-4">
            {topHunters?.rows.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No hunters ranked yet. Be the first.
              </p>
            )}
            <ol className="flex flex-col">
              {topHunters?.rows.map((r) => (
                <li
                  key={r.profileId}
                  className="flex items-center gap-3 border-b border-white/40 px-2 py-3 last:border-0"
                >
                  <span
                    className={
                      r.rank === 1
                        ? "flex size-8 items-center justify-center rounded-xl bg-amber-400/90 text-sm font-black text-amber-950"
                        : r.rank === 2
                          ? "flex size-8 items-center justify-center rounded-xl bg-slate-300/90 text-sm font-black text-slate-700"
                          : r.rank === 3
                            ? "flex size-8 items-center justify-center rounded-xl bg-amber-600/80 text-sm font-black text-white"
                            : "flex size-8 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary"
                    }
                  >
                    {r.rank}
                  </span>
                  <span className="text-xl" aria-hidden>{r.avatarEmoji}</span>
                  <span className="font-bold">{r.username}</span>
                  {r.isDemo && (
                    <span className="rounded-full border border-dashed px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                      DEMO
                    </span>
                  )}
                  <span className="ml-auto text-sm font-black text-primary">
                    {r.xp} XP
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 pt-6">
        <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-14 text-center md:py-20">
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight md:text-5xl">
            Think you can find a lower price?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join the community of hunters. Earn XP, climb the global ranking and
            win your first Price War today.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="rounded-2xl px-8 font-black tracking-wide" asChild>
              <Link to="/auth?returnTo=%2Fwars">JOIN THE WAR</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="glass rounded-2xl px-8 font-black tracking-wide"
              asChild
            >
              <Link to="/wars">EXPLORE WARS</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row">
          <Logo compact />
          <p>
            Points are virtual and do not represent money. All revenue metrics
            start at €0.00 until real conversions exist.
          </p>
          <div className="flex gap-4">
            <Link to="/business" className="hover:text-foreground">Business</Link>
            <Link to="/settings" className="hover:text-foreground">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
