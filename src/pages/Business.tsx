import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
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
import { Briefcase, Loader2, Plus, Megaphone, BarChart3, Info, Phone, Mail, Send, Euro } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";
import { convexHttpUrl } from "@/lib/convexHttp";

/** Owner's direct-payment contact — companies pay by MB Way/transfer. */
const OWNER_CONTACT = {
  mbway: "+351 927 220 303",
  mbwayRaw: "+351927220303",
  mbwayName: "DEALWAR",
};

/** Pricing cards — buy online via Stripe or fall back to MB Way. */
function PackageCards() {
  const [pkgKey, setPkgKey] = useState<string | null>(null);
  const [buyName, setBuyName] = useState("");
  const [buyEmail, setBuyEmail] = useState("");
  const [buyBusy, setBuyBusy] = useState(false);
  const [stripeDown, setStripeDown] = useState(false);

  const PACKAGES = [
    { key: "basic", name: "Básico", price: 30, desc: "1 guerra patrocinada · 7 dias · badge SPONSORED" },
    { key: "pro", name: "Pro", price: 80, desc: "1 guerra patrocinada · 14 dias · destaque na home", highlight: true },
    { key: "brand", name: "Marca", price: 200, desc: "Guerra de marca · 30 dias · banner no ranking" },
  ];

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    if (!pkgKey) return;
    setBuyBusy(true);
    try {
      const res = await fetch(`${convexHttpUrl()}/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageKey: pkgKey,
          businessName: buyName.trim(),
          email: buyEmail.trim(),
          origin: window.location.origin, // return here after paying
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url; // off to Stripe Checkout
      } else if (res.status === 503) {
        setStripeDown(true);
        toast.error("Pagamento online ainda não ativo — usa o MB Way por agora.");
      } else {
        toast.error(data.error ?? "Falhou a criar o pagamento.");
      }
    } catch {
      toast.error("Falhou a ligar ao servidor de pagamentos.");
    } finally {
      setBuyBusy(false);
    }
  }

  return (
    <section className="glass rounded-3xl p-6">
      <h2 className="text-xl font-black tracking-tight">Pacotes de patrocínio</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Escolhe, paga online (Stripe) e a tua guerra entra na fila de lançamento.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {PACKAGES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setPkgKey(pkgKey === p.key ? null : p.key);
              setStripeDown(false);
            }}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all",
              pkgKey === p.key
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "border-white/40 bg-white/40 hover:bg-white/60",
              p.highlight && pkgKey !== p.key && "ring-1 ring-amber-400/60",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-wide">{p.name}</span>
              {p.highlight && (
                <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[9px] font-black text-amber-950">
                  POPULAR
                </span>
              )}
            </div>
            <p className="mt-1 text-3xl font-black tabular-nums">
              {p.price}€
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
          </button>
        ))}
      </div>

      {pkgKey && (
        <form onSubmit={handleBuy} className="glass-subtle mt-4 flex flex-col gap-2 rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Finalizar: {PACKAGES.find((p) => p.key === pkgKey)?.name} — {PACKAGES.find((p) => p.key === pkgKey)?.price}€
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={buyName}
              onChange={(e) => setBuyName(e.target.value)}
              placeholder="Nome da empresa"
              required
              minLength={2}
              maxLength={80}
              className="glass rounded-xl"
              aria-label="Nome da empresa"
            />
            <Input
              type="email"
              value={buyEmail}
              onChange={(e) => setBuyEmail(e.target.value)}
              placeholder="Email para a fatura"
              required
              maxLength={120}
              className="glass rounded-xl"
              aria-label="Email"
            />
          </div>
          <Button type="submit" className="rounded-xl bg-emerald-600 font-black hover:bg-emerald-700" disabled={buyBusy}>
            {buyBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Euro className="mr-2 size-4" />}
            Pagar {PACKAGES.find((p) => p.key === pkgKey)?.price}€ com Stripe
          </Button>
          {stripeDown && (
            <p className="text-[11px] text-muted-foreground">
              Pagamento online <strong>ainda não configurado</strong> — paga por
              MB Way para <strong>{OWNER_CONTACT.mbway}</strong> e envia o
              comprovativo para o formulário "Pedir proposta" abaixo.
            </p>
          )}
        </form>
      )}
    </section>
  );
}

/** Public sponsorship funnel — the sales channel. Works signed-out. */
function SponsorshipFunnel() {
  const requestSponsorship = useMutation(api.sponsorLeads.requestSponsorship);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);

  async function handleLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadBusy(true);
    try {
      await requestSponsorship({
        name: leadName.trim(),
        email: leadEmail.trim(),
        message: leadMessage.trim(),
      });
      toast.success("Pedido enviado! Respondemos para o teu email.");
      setLeadName("");
      setLeadEmail("");
      setLeadMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falhou o envio.");
    } finally {
      setLeadBusy(false);
    }
  }

  return (
    <section className="glass-strong rounded-3xl p-6">
      <h2 className="text-xl font-black tracking-tight">
        Patrocina uma Guerra de Preços
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A tua marca no centro de uma competição ao vivo: hunters de todo o
        país caçam o melhor preço do teu produto. Conteúdo sempre marcado
        como <strong>SPONSORED</strong>.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="glass-subtle rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Pagamento direto — MB Way
            </p>
            <p className="mt-1 flex items-center gap-2 text-lg font-black tabular-nums">
              <Phone className="size-4 text-emerald-600" />
              <a href={`tel:${OWNER_CONTACT.mbwayRaw}`} className="hover:underline">
                {OWNER_CONTACT.mbway}
              </a>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Transferência ou MB Way para {OWNER_CONTACT.mbwayName}. Após
              pagamento, a tua guerra fica no ar.
            </p>
          </div>
          <div className="glass-subtle rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Contacto direto
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold">
              <Mail className="size-4 text-primary" />
              <a href={`mailto:geral@dealwar.pt?subject=${encodeURIComponent("Patrocínio DEALWAR")}`} className="hover:underline">
                geral@dealwar.pt
              </a>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Resposta em 24h úteis. Pacotes desde €30/semana.
            </p>
          </div>
        </div>
        <form onSubmit={handleLead} className="flex flex-col gap-2">
          <Input
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
            placeholder="Nome da empresa"
            required
            minLength={2}
            maxLength={80}
            className="glass-subtle rounded-xl"
            aria-label="Nome da empresa"
          />
          <Input
            type="email"
            value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
            placeholder="Email de contacto"
            required
            maxLength={120}
            className="glass-subtle rounded-xl"
            aria-label="Email de contacto"
          />
          <textarea
            value={leadMessage}
            onChange={(e) => setLeadMessage(e.target.value)}
            placeholder="Que produto queres destacar? (mín. 10 caracteres)"
            required
            minLength={10}
            maxLength={600}
            rows={3}
            className="glass-subtle rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Mensagem"
          />
          <Button type="submit" className="rounded-xl bg-emerald-600 font-black hover:bg-emerald-700" disabled={leadBusy}>
            {leadBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Pedir proposta
          </Button>
        </form>
      </div>
    </section>
  );
}

export default function Business() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const business = useQuery(api.business.getMyBusiness, isAuthenticated ? {} : "skip");
  const campaigns = useQuery(api.business.listMyCampaigns, isAuthenticated ? {} : "skip");
  const stats = useQuery(api.business.myBusinessStats, isAuthenticated ? {} : "skip");

  const registerBusiness = useMutation(api.business.registerBusiness);
  const createCampaign = useMutation(api.business.createCampaign);
  const createSponsoredWar = useMutation(api.business.createSponsoredWar);

  const [bizName, setBizName] = useState("");
  const [bizWebsite, setBizWebsite] = useState("");
  const [regBusy, setRegBusy] = useState(false);

  const [campName, setCampName] = useState("");
  const [campType, setCampType] = useState("sponsored_war");
  const [campBusy, setCampBusy] = useState(false);

  const [warTitle, setWarTitle] = useState("");
  const [warProduct, setWarProduct] = useState("");
  const [warPrice, setWarPrice] = useState("");
  const [warBusy, setWarBusy] = useState(false);
  const activeCampaign = campaigns?.find((c) => c.status !== "ended");

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-6">
        <PackageCards />
        <SponsorshipFunnel />
        <div className="glass rounded-3xl p-8 text-center">
          <Briefcase className="mx-auto size-10 text-primary" />
          <h1 className="mt-3 text-xl font-black tracking-tight">Business Area</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            For stores and brands: create sponsored Price Wars and reach deal
            hunters. All sponsored content is clearly labelled.
          </p>
          <Button className="mt-6 rounded-xl font-black" onClick={() => navigate("/auth?returnTo=%2Fbusiness")}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegBusy(true);
    try {
      await registerBusiness({ name: bizName.trim(), website: bizWebsite.trim() || undefined });
      toast.success("Business registered.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register business.");
    } finally {
      setRegBusy(false);
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCampBusy(true);
    try {
      await createCampaign({ name: campName.trim(), type: campType as never, status: "draft" });
      toast.success("Campaign created as draft.");
      setCampName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create campaign.");
    } finally {
      setCampBusy(false);
    }
  }

  async function handleSponsoredWar(e: React.FormEvent) {
    e.preventDefault();
    if (!activeCampaign) return;
    setWarBusy(true);
    try {
      const price = parseFloat(warPrice.replace(",", "."));
      await createSponsoredWar({
        campaignId: activeCampaign._id,
        title: warTitle.trim(),
        productName: warProduct.trim(),
        originalPrice: Math.round(price * 100),
      });
      toast.success("Sponsored war created — clearly labelled SPONSORED.");
      setWarTitle("");
      setWarProduct("");
      setWarPrice("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create sponsored war.");
    } finally {
      setWarBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <Briefcase className="size-7 text-primary" /> Business Area
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For stores and brands. Sponsored content is always clearly identified.
        </p>
      </header>

      <PackageCards />
      <SponsorshipFunnel />

      {business === undefined && <Skeleton className="h-40 rounded-3xl" />}

      {business === null && (
        <form onSubmit={handleRegister} className="glass rounded-3xl p-6">
          <h2 className="font-black tracking-tight">Register your company</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            One business profile per account. Verification is done by admins.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bizname" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Company name
              </label>
              <Input id="bizname" value={bizName} onChange={(e) => setBizName(e.target.value)} required minLength={2} maxLength={60} className="mt-1" />
            </div>
            <div>
              <label htmlFor="bizweb" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Website (optional)
              </label>
              <Input id="bizweb" type="url" value={bizWebsite} onChange={(e) => setBizWebsite(e.target.value)} placeholder="https://…" className="mt-1" />
            </div>
          </div>
          <Button type="submit" className="mt-4 rounded-xl font-bold" disabled={regBusy}>
            {regBusy && <Loader2 className="mr-2 size-4 animate-spin" />} Register business
          </Button>
        </form>
      )}

      {business && (
        <>
          <section className="glass-strong flex flex-wrap items-center gap-4 rounded-3xl p-6">
            <span className="glass-subtle flex size-12 items-center justify-center rounded-2xl text-2xl" aria-hidden>🏢</span>
            <div>
              <h2 className="text-lg font-black">{business.name}</h2>
              <p className="text-xs text-muted-foreground">{business.website ?? "No website configured"}</p>
            </div>
            <Badge
              className={
                business.verified
                  ? "ml-auto rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15"
                  : "ml-auto rounded-full bg-amber-400/20 text-amber-700 hover:bg-amber-400/20"
              }
            >
              {business.verified ? "VERIFIED" : "PENDING VERIFICATION"}
            </Badge>
          </section>

          {/* analytics strip — zeros are REAL until data exists */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="glass rounded-2xl p-4 text-center">
              <BarChart3 className="mx-auto size-4 text-primary" aria-hidden />
              <p className="mt-1 text-2xl font-black">{stats?.campaignViews ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Campaign views</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <Megaphone className="mx-auto size-4 text-primary" aria-hidden />
              <p className="mt-1 text-2xl font-black">{stats?.affiliateClicks ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Affiliate clicks</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="mt-3 text-2xl font-black">{stats?.conversions ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conversions</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="mt-3 text-2xl font-black">{stats ? eur(stats.confirmedCommission) : "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirmed revenue</p>
            </div>
          </section>

          {/* campaigns */}
          <section className="glass rounded-3xl p-6">
            <h2 className="font-black tracking-tight">Campaigns</h2>
            {(campaigns?.length ?? 0) === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                No campaigns yet. Create your first one below.
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2">
              {campaigns?.map((c) => (
                <div key={c._id} className="glass-subtle flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.type.replace(/_/g, " ")}
                      {c.warSlug && (
                        <>
                          {" · "}
                          <Link to={`/war/${c.warSlug}`} className="text-primary hover:underline">
                            view war
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto rounded-full uppercase">
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateCampaign} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Input
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                placeholder="New campaign name"
                required
                minLength={3}
                maxLength={80}
              />
              <Select value={campType} onValueChange={setCampType}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  <SelectItem value="sponsored_war">Sponsored War</SelectItem>
                  <SelectItem value="product_launch">Product Launch</SelectItem>
                  <SelectItem value="brand_war">Brand War</SelectItem>
                  <SelectItem value="special_offer">Special Offer</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="rounded-xl font-bold" disabled={campBusy}>
                {campBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
                Create
              </Button>
            </form>
          </section>

          {/* sponsored war creation */}
          <section className="glass rounded-3xl p-6">
            <h2 className="font-black tracking-tight">Create Sponsored War</h2>
            <div className="glass-subtle mt-2 flex items-start gap-2 rounded-2xl p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              Needs a campaign (any status except ended). The war will show a
              clear SPONSORED badge. Payments are not enabled in V1 — no billing
              occurs.
            </div>
            {!activeCampaign ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Create a campaign first to launch a sponsored war.
              </p>
            ) : (
              <form onSubmit={handleSponsoredWar} className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="wartitle" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    War title
                  </label>
                  <Input id="wartitle" value={warTitle} onChange={(e) => setWarTitle(e.target.value)} required minLength={6} maxLength={90} className="mt-1" />
                </div>
                <div>
                  <label htmlFor="warprod" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Product name
                  </label>
                  <Input id="warprod" value={warProduct} onChange={(e) => setWarProduct(e.target.value)} required minLength={2} className="mt-1" />
                </div>
                <div>
                  <label htmlFor="warprice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Price to beat (€)
                  </label>
                  <Input id="warprice" inputMode="decimal" value={warPrice} onChange={(e) => setWarPrice(e.target.value)} required className="mt-1" />
                </div>
                <Button type="submit" className="rounded-xl font-black tracking-wide sm:col-span-2" disabled={warBusy}>
                  {warBusy && <Loader2 className="mr-2 size-4 animate-spin" />}
                  LAUNCH SPONSORED WAR
                </Button>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}
