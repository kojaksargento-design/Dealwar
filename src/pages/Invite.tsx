import { useQuery, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ShellPage } from "@/components/dealwar/ShellPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserPlus,
  Copy,
  Check,
  MessageCircle,
  Facebook,
  Twitter,
  Zap,
  Trophy,
  Swords,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function Invite() {
  const { isAuthenticated } = useAuth();
  const stats = useQuery(api.referrals.getMyStats, isAuthenticated ? {} : "skip");
  const ensureCode = useMutation(api.referrals.ensureMyCode);

  const [copied, setCopied] = useState(false);
  const code = stats?.code ?? null;

  // Older accounts may not have a code yet — create lazily on open.
  useEffect(() => {
    if (isAuthenticated && stats && !stats.code) {
      void ensureCode({});
    }
  }, [isAuthenticated, stats, ensureCode]);

  const url = code ? `${window.location.origin}/?ref=${code}` : window.location.origin;
  const text = `⚔️ Entrei no DEALWAR — a Guerra dos Preços! Caço promoções, ganho XP e prémios. Entra pelo meu convite e ganha +50 XP de boas-vindas:`;

  const channels = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
    },
    {
      id: "x",
      label: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      toast.success("Link de convite copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não consegui copiar o link.");
    }
  }

  return (
    <ShellPage>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="text-center">
          <div className="glass mx-auto flex size-16 items-center justify-center rounded-3xl">
            <UserPlus className="size-8 text-primary" />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Convida. Ganha. Repete.</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Cada amigo que entra pelo teu link rende-te XP — e se ele caçar a sério, ganhas ainda mais. O teu exército de caçadores começa aqui.
          </p>
        </header>

        {/* Recompensas */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="glass glass-hover rounded-3xl p-4 text-center">
            <Zap className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-2xl font-black">+50</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">XP para o teu amigo</p>
          </div>
          <div className="glass glass-hover rounded-3xl p-4 text-center">
            <UserPlus className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-2xl font-black">+30</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">XP por cada registo</p>
          </div>
          <div className="glass glass-hover rounded-3xl p-4 text-center">
            <Trophy className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-2xl font-black">+75</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">XP quando ele cria guerra ou vence</p>
          </div>
        </div>

        {/* Link de convite */}
        {isAuthenticated ? (
          <div className="glass-strong rounded-3xl p-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
              O teu link de convite
            </p>
            {stats === undefined || !code ? (
              <Skeleton className="mt-3 h-12 rounded-2xl" />
            ) : (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <div className="glass-subtle flex min-w-0 flex-1 items-center rounded-2xl px-4 py-3">
                    <span className="truncate text-sm font-bold">{url}</span>
                  </div>
                  <Button className="rounded-2xl font-bold" onClick={copyLink}>
                    {copied ? <Check className="mr-1 size-4" /> : <Copy className="mr-1 size-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {channels.map((c) => (
                    <a key={c.id} href={c.href} target="_blank" rel="noopener noreferrer" onClick={() => toast("A partilhar… cada convite vale XP! 🎯")}>
                      <Button variant="outline" className="glass w-full rounded-2xl font-bold">
                        <c.icon className="mr-1 size-4" /> {c.label}
                      </Button>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="glass rounded-3xl p-8 text-center">
            <h2 className="text-xl font-black">Entra para receber o teu link</h2>
            <Button className="mt-5 rounded-xl font-black" asChild>
              <Link to="/auth?returnTo=%2Finvite">Entrar</Link>
            </Button>
          </div>
        )}

        {/* Estatisticas */}
        {isAuthenticated && stats && (
          <div className="glass rounded-3xl p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-3xl font-black">{stats.inviteCount}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">caçadores recrutados</p>
              </div>
              <div>
                <p className="text-3xl font-black text-primary">{stats.totalXp}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">XP ganho com convites</p>
              </div>
              <Link to="/affiliate" className="ml-auto text-sm font-bold text-primary hover:underline">
                Quero ganhar dinheiro → Afiliados 💸
              </Link>
            </div>
            {stats.rewards.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 border-t border-white/40 pt-4">
                {stats.rewards.slice(0, 6).map((r) => (
                  <li key={r._id} className="flex items-center gap-2 text-sm">
                    <Swords className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {r.type === "signup" ? "Novo recruta" : r.type === "invitee_first_war" ? "Recruta criou guerra" : "Recruta venceu caça"}
                    </span>
                    <span className="ml-auto font-black text-primary">+{r.xpAwarded} XP</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </ShellPage>
  );
}
