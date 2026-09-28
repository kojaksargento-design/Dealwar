import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ShellPage } from "@/components/dealwar/ShellPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Store,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Handshake,
  Info,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { eur } from "@/lib/format";

export default function Affiliate() {
  const { isAuthenticated } = useAuth();
  const dash = useQuery(api.affiliateProgram.getMyDashboard, isAuthenticated ? {} : "skip");
  const partners = useQuery(api.affiliateProgram.listPartners, {});

  const join = useMutation(api.affiliateProgram.joinProgram);
  const requestPayout = useMutation(api.affiliateProgram.requestPayout);

  const [joining, setJoining] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"mbway" | "bank">("mbway");
  const [payoutContact, setPayoutContact] = useState("");
  const [requesting, setRequesting] = useState(false);

  async function handleJoin() {
    setJoining(true);
    try {
      await join({});
      toast.success("Estás dentro! Partilha os teus links e começa a ganhar. 💸");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro.");
    } finally {
      setJoining(false);
    }
  }

  async function handlePayout(e: React.FormEvent) {
    e.preventDefault();
    setRequesting(true);
    try {
      await requestPayout({ method: payoutMethod, contact: payoutContact });
      toast.success("Saque solicitado! Pagamento em até 48h.");
      setPayoutContact("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <ShellPage>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="text-center">
          <div className="glass mx-auto flex size-16 items-center justify-center rounded-3xl">
            <Handshake className="size-8 text-primary" />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Ganha com as tuas lojas favoritas</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Junta-te ao programa de afiliados DEALWAR: partilha produtos de Temu, Amazon, Shein e mais —
            quando alguém compra pelo teu link, <span className="font-bold text-foreground">ganhas 70% da comissão</span>.
          </p>
        </header>

        {/* Como funciona */}
        <div className="glass rounded-3xl p-6">
          <h2 className="font-black tracking-tight">Como funciona</h2>
          <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
            <li>Entras no programa (grátis, leva 1 clique).</li>
            <li>Partilhas links de produtos das lojas parceiras — na app, no WhatsApp, onde quiseres.</li>
            <li>Alguém clica e compra → a rede de afiliados paga comissão real à plataforma.</li>
            <li>70% é teu, automaticamente no teu saldo. Sacas por MB Way a partir de 10€.</li>
          </ol>
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            Transparência total: o saldo só cresce com comissões <span className="font-bold">reais confirmadas</span> pelas redes — nada é simulado. Comissões demoram 30–60 dias a ser confirmadas pelas redes (padrão do mercado).
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="glass rounded-3xl p-8 text-center">
            <h2 className="text-xl font-black">Entra para começares a ganhar</h2>
            <Button className="mt-5 rounded-xl font-black" asChild>
              <Link to="/auth?returnTo=%2Faffiliate">Entrar</Link>
            </Button>
          </div>
        ) : dash === undefined || dash === null ? (
          <Skeleton className="h-64 rounded-3xl" />
        ) : !dash.partner ? (
          <div className="glass-strong rounded-3xl p-8 text-center">
            <Wallet className="mx-auto size-10 text-primary" />
            <h2 className="mt-3 text-xl font-black">Torna-te afiliado DEALWAR</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Grátis, sem obrigações. Recebes o teu código exclusivo e começas a acumular saldo real.
            </p>
            <Button size="lg" className="mt-5 rounded-2xl px-8 font-black" onClick={handleJoin} disabled={joining}>
              <Handshake className="mr-2 size-4" /> JUNTAR-ME AGORA
            </Button>
          </div>
        ) : (
          <>
            {/* Saldo */}
            <div className="glass-strong grid gap-4 rounded-3xl p-6 sm:grid-cols-3">
              <div className="text-center sm:text-left">
                <p className="text-3xl font-black text-emerald-600">{eur(dash.balance)}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">saldo disponível</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-3xl font-black">{eur(dash.totalEarned)}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">total ganho</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-3xl font-black">{dash.confirmedCount + dash.pendingCount}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">conversões</p>
              </div>
            </div>

            {/* Pedido de saque */}
            <form onSubmit={handlePayout} className="glass rounded-3xl p-6">
              <h2 className="flex items-center gap-2 font-black tracking-tight">
                <Wallet className="size-4 text-primary" /> Sacar o meu saldo
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
                <Select value={payoutMethod} onValueChange={(v) => setPayoutMethod(v as "mbway" | "bank")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mbway">MB Way</SelectItem>
                    <SelectItem value="bank">Transferência</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={payoutContact}
                  onChange={(e) => setPayoutContact(e.target.value)}
                  placeholder={payoutMethod === "mbway" ? "+351 9XX XXX XXX" : "IBAN (PT50...)"} 
                  required
                />
                <Button type="submit" className="rounded-xl font-black" disabled={requesting || dash.balance < 1000}>
                  Pedir saque
                </Button>
              </div>
              {dash.balance < 1000 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Mínimo para saque: 10€ — faltam {eur(1000 - dash.balance)}.
                </p>
              )}
            </form>

            {/* Conversoes */}
            {dash.conversions.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  As minhas conversões
                </h2>
                <div className="mt-3 flex flex-col gap-2">
                  {dash.conversions.map((c) => (
                    <div key={c._id} className="glass-subtle flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
                      <Store className="size-4 text-muted-foreground" />
                      <p className="text-sm font-bold">{c.storeLabel}</p>
                      {c.orderValue && (
                        <span className="text-xs text-muted-foreground">pedido {eur(c.orderValue)}</span>
                      )}
                      {c.status === "confirmed" ? (
                        <Badge className="ml-auto rounded-full bg-emerald-500/15 text-emerald-700">
                          +{eur(c.userShare ?? 0)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-auto rounded-full">
                          {c.status === "pending" ? "em confirmação" : c.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Lojas parceiras */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="size-4" /> Lojas parceiras
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {partners?.map((p) => (
              <a key={p.key} href={p.url} target="_blank" rel="noopener noreferrer" className="glass glass-hover flex items-center gap-3 rounded-2xl p-4">
                <Store className="size-4 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{p.label}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.network}</p>
                </div>
                <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Os links de produto específicos são gerados pela equipa DEALWAR a partir das redes de afiliação (Awin, Admitad, Amazon Associates) e atribuídos ao teu código — por isso cada clique teu fica registado.
          </p>
        </section>
      </div>
    </ShellPage>
  );
}
