import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WarCard } from "@/components/dealwar/WarCard";
import { Logo } from "@/components/dealwar/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import {
  Search,
  Swords,
  ArrowRight,
  Crosshair,
  Trophy,
  ShieldCheck,
  Zap,
  Medal,
  Target,
  BadgeCheck,
  Gift,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const STEPS = [
  { key: 1, title: "step1", desc: "step1d" },
  { key: 2, title: "step2", desc: "step2d" },
  { key: 3, title: "step3", desc: "step3d" },
  { key: 4, title: "step4", desc: "step4d" },
] as const;

const XP_ACTIONS = [
  { icon: Swords, label: "actCreateWar", xp: "+10" },
  { icon: Target, label: "actJoinHunt", xp: "+5" },
  { icon: BadgeCheck, label: "actDiscovery", xp: "+50" },
  { icon: Zap, label: "actBeatPrice", xp: "+100" },
  { icon: Medal, label: "actShare", xp: "+2" },
] as const;

const LEVELS = [
  { name: "Bronze", min: 0 },
  { name: "Prata", min: 150 },
  { name: "Ouro", min: 400 },
  { name: "Diamante", min: 900 },
  { name: "Lenda", min: 2000 },
];

const RULES = ["rule1", "rule2", "rule3", "rule4"] as const;

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useI18n();
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
            <Link to="/wars" className="hover:text-foreground">{t("navExplore")}</Link>
            <Link to="/trending" className="hover:text-foreground">{t("navTrending")}</Link>
            <Link to="/ranking" className="hover:text-foreground">{t("navRanking")}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" className="hidden rounded-full font-semibold sm:inline-flex" asChild>
              <Link to="/auth?returnTo=%2Fprofile">{t("enter")}</Link>
            </Button>
            <Button size="sm" className="rounded-full font-bold" asChild>
              <Link to="/auth?returnTo=%2Fcreate">{t("createWar")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 md:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-primary"
          >
            <Crosshair className="size-3.5" /> {t("tagline")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-6 bg-gradient-to-br from-foreground via-foreground to-primary/70 bg-clip-text text-6xl font-black leading-none tracking-tighter text-transparent md:text-8xl"
          >
            DEAL<span className="text-primary">WAR</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-4 text-lg font-semibold text-muted-foreground md:text-xl"
          >
            {t("hero1")} <span className="text-foreground">{t("hero2")}</span>{" "}
            <span className="text-primary">{t("hero3")}</span>
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
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button type="submit" className="rounded-xl font-bold">{t("search")}</Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <Button size="lg" className="rounded-2xl px-8 font-black tracking-wide" asChild>
              <Link to="/wars">
                {t("exploreWars")} <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="glass rounded-2xl px-8 font-black tracking-wide"
              asChild
            >
              <Link to="/auth?returnTo=%2Fcreate">
                <Swords className="mr-2 size-4" /> {t("createWar")}
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
          {t("howItWorks")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.key} className="glass glass-hover rounded-3xl p-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                {s.key}
              </span>
              <h3 className="mt-3 font-bold">{t(s.title)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(s.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premio de compra — destaque */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-6 ring-1 ring-primary/25 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg shadow-primary/30">
              <Gift className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">{t("prizeTitle")}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">{t("prizeSub")}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <p className="flex items-start gap-2 text-sm font-medium">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {t("prizeLine1")}
                </p>
                <p className="flex items-start gap-2 text-sm font-medium">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {t("prizeLine2")}
                </p>
                <p className="flex items-start gap-2 text-sm font-medium">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {t("prizeLine3")}
                </p>
                <p className="flex items-start gap-2 text-sm font-medium">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {t("prizeLine4")}
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" className="rounded-2xl px-6 font-black tracking-wide" asChild>
                  <Link to="/victory">
                    <Trophy className="mr-2 size-4" /> {t("prizeCta")}
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{t("prizeHowTitle")}:</span>{" "}
                  {t("prizeHow1")} {t("prizeHow2")} {t("prizeHow3")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ganha XP. Sobe de nivel. */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-center text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
          {t("gamifyTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
          {t("gamifySub")}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="glass glass-hover rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <h3 className="font-bold">{t("howToEarnXp")}</h3>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {XP_ACTIONS.map((a) => (
                <li key={a.label} className="flex items-center gap-2 text-sm">
                  <a.icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="text-muted-foreground">{t(a.label)}</span>
                  <span className="ml-auto font-black text-primary">{a.xp}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass glass-hover rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              <h3 className="font-bold">{t("hunterLevels")}</h3>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {LEVELS.map((l) => (
                <li key={l.name} className="flex items-center gap-2 text-sm">
                  <span className="font-bold">{l.name}</span>
                  <span className="ml-auto text-muted-foreground">{l.min} XP</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass glass-hover rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <Medal className="size-4 text-primary" />
              <h3 className="font-bold">{t("badgesMissions")}</h3>
            </div>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <li>{t("badgesLine1")}</li>
              <li>{t("badgesLine2")}</li>
              <li>{t("badgesLine3")}</li>
              <li>{t("badgesLine4")}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Regras de honestidade */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <h2 className="text-lg font-black tracking-tight">{t("rulesTitle")}</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {RULES.map((r) => (
              <p key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {t(r)}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Guerra do dia */}
      {daily && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="glass-strong relative overflow-hidden rounded-3xl p-6 md:p-8">
            <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {t("dailyWar")}
            </span>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">
              {t("battleOfDay")}
            </p>
            <h2 className="mt-2 max-w-lg text-2xl font-black tracking-tight md:text-3xl">
              {daily.title}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground">{t("original")}</p>
                <p className="text-xl font-black line-through">{(daily.originalPrice / 100).toFixed(2)}€</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("bestVerified")}</p>
                <p className="text-3xl font-black tracking-tighter text-emerald-600">
                  {(daily.bestPrice / 100).toFixed(2)}€
                </p>
              </div>
              <Button className="ml-auto rounded-xl font-black tracking-wide" asChild>
                <Link to={`/war/${daily.slug}`}>{t("beatThisPrice")}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Guerras ativas */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">{t("liveWars")}</h2>
          <Link to="/wars" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
            {t("seeAll")} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {openWars === undefined &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          {openWars?.length === 0 && (
            <div className="glass col-span-full rounded-3xl p-8 text-center">
              <p className="font-bold">{t("noWars")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("noWarsSub")}</p>
              <Button className="mt-4 rounded-xl font-bold" asChild>
                <Link to="/auth?returnTo=%2Fcreate">{t("createWar")}</Link>
              </Button>
            </div>
          )}
          {openWars?.map((w) => <WarCard key={w._id} war={w} compact />)}
        </div>
      </section>

      {/* Tendencias + Top cacadores */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">{t("trending")}</h2>
            <Link to="/trending" className="text-sm font-bold text-primary hover:underline">
              {t("more")}
            </Link>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {trending?.length === 0 && (
              <p className="glass rounded-2xl p-5 text-sm text-muted-foreground">
                {t("noTrending")}
              </p>
            )}
            {trending?.map((w) => <WarCard key={w._id} war={w} compact />)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">{t("topHunters")}</h2>
            <Link to="/ranking" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              <Trophy className="size-4" /> {t("navRanking")}
            </Link>
          </div>
          <div className="glass mt-5 rounded-3xl p-4">
            {topHunters?.rows.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">{t("noHunters")}</p>
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
            {t("ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("ctaSub")}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" className="rounded-2xl px-8 font-black tracking-wide" asChild>
              <Link to="/auth?returnTo=%2Fwars">{t("ctaJoin")}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="glass rounded-2xl px-8 font-black tracking-wide"
              asChild
            >
              <Link to="/wars">{t("exploreWars")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row">
          <Logo compact />
          <p>{t("footerNote")}</p>
          <div className="flex gap-4">
            <Link to="/business" className="hover:text-foreground">{t("footerBusiness")}</Link>
            <Link to="/settings" className="hover:text-foreground">{t("footerSettings")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
