import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ShellPage } from "@/components/dealwar/ShellPage";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ShieldAlert,
  Euro,
  Eye,
  Swords,
  UserPlus,
  MousePointerClick,
  Hourglass,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Banknote,
} from "lucide-react";
import { eur, eurToCents, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/** Tiny sparkline: bars per minute, no chart lib needed. */
function MinuteBars({
  points,
  className,
  tone = "primary",
}: {
  points: { t: number; count: number }[];
  className?: string;
  tone?: "primary" | "amber" | "emerald";
}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const toneClass =
    tone === "amber"
      ? "bg-amber-500/80"
      : tone === "emerald"
        ? "bg-emerald-500/80"
        : "bg-primary/80";
  return (
    <div
      className={cn("flex h-16 items-end gap-px", className)}
      aria-label="Activity per minute, last hour"
      role="img"
    >
      {points.map((p) => (
        <div
          key={p.t}
          className={cn("min-w-[2px] flex-1 rounded-t-sm", toneClass)}
          style={{ height: `${Math.max(p.count > 0 ? 8 : 2, (p.count / max) * 100)}%` }}
          title={`${p.count} · ${new Date(p.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        />
      ))}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" aria-hidden />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1 text-2xl font-black tabular-nums tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function Owner() {
  const { isAuthenticated } = useAuth();
  const isAdmin = useQuery(
    api.gamification.isMyAdmin,
    isAuthenticated ? {} : "skip",
  );
  const ready = isAuthenticated === true && isAdmin === true;

  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");
  const recordPayment = useMutation(api.owner.recordManualPayment);

  // Sponsorship leads queue (owner-only)
  const leads = useQuery(api.sponsorLeads.listLeads, ready ? {} : "skip");
  const setLeadStatus = useMutation(api.sponsorLeads.setLeadStatus);

  // Stripe orders queue (owner-only)
  const orders = useQuery(api.packages.listOrders, ready ? {} : "skip");

  const [pulse, setPulse] = useState(0); // re-render tick for "updated Xs ago"
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => setPulse((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [ready]);

  const stats = useQuery(
    api.owner.ownerStats,
    ready ? { buckets: 60 } : "skip",
  );

  if (!isAuthenticated) {
    return (
      <ShellPage>
        <div className="glass rounded-3xl p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-3 text-xl font-black tracking-tight">Área do dono</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Restrita ao proprietário da plataforma (flag isAdmin no servidor).
          </p>
        </div>
      </ShellPage>
    );
  }

  if (isAdmin === undefined) {
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
          <h1 className="mt-3 text-xl font-black tracking-tight">Sem acesso</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            A tua conta não tem permissões de dono. O acesso é concedido apenas
            no servidor (profiles.isAdmin).
          </p>
        </div>
      </ShellPage>
    );
  }

  if (stats === undefined) {
    return (
      <ShellPage>
        <Skeleton className="h-96 rounded-3xl" />
      </ShellPage>
    );
  }
  if (stats === null) {
    return (
      <ShellPage>
        <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground">
          Sessão expirada. Entra novamente para ver o dashboard.
        </div>
      </ShellPage>
    );
  }

  const secondsAgo = Math.max(0, Math.floor((Date.now() - stats.now) / 1000));

  const totalRealRevenue =
    stats.revenue.manualRevenue +
    stats.revenue.confirmedRevenue +
    stats.revenue.stripePaid;

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    const cents = eurToCents(amount);
    if (cents === null) {
      toast.error("Valor inválido. Exemplo: 49.90");
      return;
    }
    if (source.trim().length < 2) {
      toast.error("Indica quem pagou (ex.: nome da empresa).");
      return;
    }
    try {
      await recordPayment({ amount: cents, source: source.trim(), note: note.trim() || undefined });
      toast.success(`Pagamento de ${eur(cents)} registado.`);
      setAmount("");
      setSource("");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falhou ao registar.");
    }
  }

  return (
    <ShellPage>
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
              <Activity className="size-7 text-primary" /> Dono — Live
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="size-3 animate-spin text-emerald-500" aria-hidden />
              Atualiza em tempo real · atualizado há {secondsAgo}s
            </p>
          </div>
          <span className="glass-subtle flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
            <RefreshCw className="size-3.5" aria-hidden /> tempo real (sem recarregar)
          </span>
        </header>

        {/* Ganhos ao minuto — REAL money only, honesty rules */}
        <section className="glass rounded-3xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ganhos reais (total)
              </p>
              <p className="text-4xl font-black tabular-nums tracking-tight text-emerald-600">
                {eur(totalRealRevenue)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Dinheiro real recebido por ti + comissões confirmadas por redes.
                Nunca simulado — começa em €0.00.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-5">
              {[
                { label: "Stripe (pago)", value: eur(stats.revenue.stripePaid) },
                { label: "Recebido diretamente", value: eur(stats.revenue.manualRevenue) },
                { label: "Afiliados confirmado", value: eur(stats.revenue.confirmedRevenue) },
                { label: "Pendente", value: eur(stats.revenue.pendingRevenue) },
                { label: "Última hora", value: eur(stats.manualLastHour) },
              ].map((s) => (
                <div key={s.label} className="glass-subtle rounded-xl px-3 py-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-sm font-black tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Cliques de afiliado · por minuto
            </p>
            <MinuteBars points={stats.clicksPerMinute} tone="emerald" className="mt-1" />
          </div>
        </section>

        {/* Pagamentos reais recebidos + registo manual */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-3xl p-5">
            <p className="flex items-center gap-2 text-sm font-black tracking-tight">
              <Banknote className="size-4 text-emerald-600" /> Recebeste dinheiro fora da plataforma?
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Regista transferências bancárias, MB Way ou faturas de empresas
              (ex.: guerra patrocinada). Fica no histórico com audit log.
            </p>
            <form onSubmit={handleRecordPayment} className="mt-4 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Valor (ex.: 49.90)"
                  inputMode="decimal"
                  className="glass-subtle rounded-xl"
                  aria-label="Valor recebido em euros"
                />
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Quem pagou"
                  maxLength={80}
                  className="glass-subtle rounded-xl"
                  aria-label="Origem do pagamento"
                />
              </div>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nota (opcional)"
                maxLength={200}
                className="glass-subtle rounded-xl"
                aria-label="Nota opcional"
              />
              <Button type="submit" className="rounded-xl bg-emerald-600 font-black hover:bg-emerald-700">
                <Banknote className="mr-2 size-4" /> Registar pagamento real
              </Button>
            </form>
          </div>

          <div className="glass rounded-3xl p-5">
            <p className="text-sm font-black tracking-tight">Últimos pagamentos recebidos</p>
            {stats.recentPayments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Ainda sem pagamentos registados — os ganhos começam em €0.00.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {stats.recentPayments.map((p) => (
                  <li
                    key={p._id}
                    className="glass-subtle flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{p.source}</p>
                      {p.note && (
                        <p className="truncate text-[11px] text-muted-foreground">{p.note}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70">{timeAgo(p.receivedAt)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black tabular-nums text-emerald-600">
                      +{eur(p.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Pedidos de patrocínio (leads) */}
        <section className="glass rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black tracking-tight">Pedidos de patrocínio</p>
            {leads && leads.some((l) => l.status === "new") && (
              <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-black text-amber-950">
                {leads.filter((l) => l.status === "new").length} NOVO{leads.filter((l) => l.status === "new").length === 1 ? "" : "S"}
              </span>
            )}
          </div>
          {leads === undefined && <Skeleton className="mt-3 h-20 rounded-2xl" />}
          {leads?.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Sem pedidos. As empresas chegam pela página Business.
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-2">
            {leads?.map((l) => (
              <li key={l._id} className="glass-subtle rounded-2xl px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold">{l.name}</p>
                  <a
                    href={`mailto:${l.email}?subject=${encodeURIComponent("DEALWAR — Patrocínio")}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {l.email}
                  </a>
                  <span className="ml-auto text-[10px] text-muted-foreground/70">
                    {timeAgo(l.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{l.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      l.status === "new"
                        ? "rounded-full bg-amber-400/20 text-amber-700 hover:bg-amber-400/20"
                        : l.status === "contacted"
                          ? "rounded-full bg-primary/10 text-primary hover:bg-primary/10"
                          : "rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15"
                    }
                  >
                    {l.status === "new" ? "NOVO" : l.status === "contacted" ? "CONTACTADO" : "FECHADO"}
                  </Badge>
                  {l.status === "new" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass h-7 rounded-xl text-xs font-bold"
                      onClick={async () => {
                        try {
                          await setLeadStatus({ leadId: l._id, status: "contacted" });
                          toast("Marcado como contactado.");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Falhou.");
                        }
                      }}
                    >
                      Marcar contactado
                    </Button>
                  )}
                  {l.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass h-7 rounded-xl text-xs font-bold"
                      onClick={async () => {
                        try {
                          await setLeadStatus({ leadId: l._id, status: "closed" });
                          toast("Pedido fechado. Se recebeste pagamento, regista-o acima.");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Falhou.");
                        }
                      }}
                    >
                      Fechar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Encomendas Stripe */}
        <section className="glass rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black tracking-tight">
              Encomendas online (Stripe)
            </p>
            {orders && orders.some((o) => o.status === "pending") && (
              <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-black text-amber-950">
                {orders.filter((o) => o.status === "pending").length} PENDENTE{orders.filter((o) => o.status === "pending").length === 1 ? "" : "S"}
              </span>
            )}
          </div>
          {orders === undefined && <Skeleton className="mt-3 h-16 rounded-2xl" />}
          {orders?.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Sem encomendas. As empresas compram na página Business.
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-2">
            {orders?.map((o) => (
              <li
                key={o._id}
                className="glass-subtle flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3"
              >
                <p className="text-sm font-bold">{o.businessName}</p>
                <span className="text-xs text-muted-foreground">· pacote {o.packageKey}</span>
                <Badge
                  className={
                    o.status === "paid"
                      ? "rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15"
                      : o.status === "pending"
                        ? "rounded-full bg-amber-400/20 text-amber-700 hover:bg-amber-400/20"
                        : "rounded-full bg-muted text-muted-foreground hover:bg-muted"
                  }
                >
                  {o.status === "paid" ? "PAGO" : o.status === "pending" ? "PENDENTE" : "CANCELADO"}
                </Badge>
                <span className="ml-auto text-sm font-black tabular-nums text-emerald-600">
                  {o.status === "paid" ? "+" : ""}
                  {eur(o.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Ao minuto */}
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat
            icon={Eye}
            label="Visitas / minuto"
            value={stats.totals.visitsLastMinute}
            sub={`${stats.totals.visitsLastHour} na última hora`}
          />
          <Stat
            icon={Swords}
            label="Ações de guerra / minuto"
            value={stats.totals.warsLastMinute}
            sub="ver, entrar, criar, submeter"
          />
          <Stat
            icon={UserPlus}
            label="Registos / minuto"
            value={stats.totals.signupsLastMinute}
            sub="contas + convidados"
          />
        </section>

        {/* Séries da última hora */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass rounded-3xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Visitas · última hora
            </p>
            <MinuteBars points={stats.visitsPerMinute} className="mt-2" />
          </div>
          <div className="glass rounded-3xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Guerras · última hora
            </p>
            <MinuteBars points={stats.warsPerMinute} tone="amber" className="mt-2" />
          </div>
          <div className="glass rounded-3xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Registos · última hora
            </p>
            <MinuteBars points={stats.signupsPerMinute} className="mt-2" />
          </div>
        </section>

        {/* Contadores da plataforma */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <Stat icon={Swords} label="Guerras" value={stats.counts.warsTotal} sub={`${stats.counts.warsOpen} abertas`} />
          <Stat icon={Hourglass} label="Submissões" value={stats.counts.submissionsTotal} sub={`${stats.counts.submissionsPending} pendentes`} />
          <Stat icon={CheckCircle2} label="Aprovadas" value={stats.counts.submissionsApproved} />
          <Stat icon={MousePointerClick} label="Cliques afiliado" value={stats.totals.clicksLastHour} sub="última hora" />
          <Stat icon={Eye} label="Hunteres" value={stats.counts.profiles} sub={`${stats.counts.guests} convidados`} />
          <Stat icon={Euro} label="Lojas" value={stats.counts.stores} sub={`${stats.counts.storesWithAffiliate} com afiliado`} />
        </section>

        {!stats.revenue.payoutConfigured && (
          <p className="glass-subtle rounded-2xl px-4 py-3 text-xs text-muted-foreground">
            Integrações de pagamento: <strong>Não configurado</strong>. Por ora
            os ganhos reais vêm dos teus registos manuais e de conversões
            confirmadas por redes de afiliados — nunca de valores simulados.
          </p>
        )}
      </div>
    </ShellPage>
  );
}
