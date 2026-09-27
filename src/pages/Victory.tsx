import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { ShellPage } from "@/components/dealwar/ShellPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Loader2, BadgeCheck, Clock, XCircle } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { eur } from "@/lib/format";

export default function Victory() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  const myWars = useQuery(api.purchasePrize.listMyWars, isAuthenticated ? {} : "skip");
  const myClaims = useQuery(api.purchasePrize.listMyClaims, isAuthenticated ? {} : "skip");

  const submitClaim = useMutation(api.purchasePrize.submitClaim);

  const [warId, setWarId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const amount = parseFloat(amountStr.replace(",", "."));
      await submitClaim({
        warId: warId ? (warId as never) : undefined,
        storeName,
        amountPaid: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : undefined,
        proofUrl,
        note: note.trim() || undefined,
      });
      toast.success(t("vcSent"), { description: t("vcSentDesc") });
      setWarId("");
      setStoreName("");
      setAmountStr("");
      setProofUrl("");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSending(false);
    }
  }

  return (
    <ShellPage>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="text-center">
          <div className="glass mx-auto flex size-16 items-center justify-center rounded-3xl">
            <Trophy className="size-8 text-primary" />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">{t("vcTitle")}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t("vcSub")}</p>
        </header>

        <div className="glass-strong rounded-3xl p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {t("prizeLine1")}
            </p>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {t("prizeLine2")}
            </p>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {t("prizeLine3")}
            </p>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> {t("prizeLine4")}
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="glass rounded-3xl p-6">
            <h2 className="font-black tracking-tight">{t("prizeHowTitle")}</h2>
            <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
              <li>{t("prizeHow1")}</li>
              <li>{t("prizeHow2")}</li>
              <li>{t("prizeHow3")}</li>
            </ol>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("vcWar")}
                </label>
                <Select value={warId} onValueChange={setWarId}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder={t("vcWarPh")} />
                  </SelectTrigger>
                  <SelectContent>
                    {myWars?.map((w) => (
                      <SelectItem key={w.warId} value={w.warId}>
                        {w.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("vcStore")}
                </label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={t("vcStorePh")}
                  required
                  maxLength={60}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("vcAmount")} (€)
                </label>
                <Input
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("vcProof")}
                </label>
                <Input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder={t("vcProofPh")}
                  type="url"
                  required
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("vcNote")}
                </label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className="mt-1" />
              </div>
            </div>
            <Button type="submit" disabled={sending} className="mt-5 w-full rounded-xl font-black tracking-wide">
              {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trophy className="mr-2 size-4" />}
              {t("vcSubmit")}
            </Button>
          </form>
        ) : (
          <div className="glass rounded-3xl p-8 text-center">
            <Trophy className="mx-auto size-10 text-primary" />
            <h2 className="mt-3 text-xl font-black">{t("vcMustAuth")}</h2>
            <Button className="mt-5 rounded-xl font-black" asChild>
              <Link to="/auth?returnTo=%2Fvictory">{t("enter")}</Link>
            </Button>
          </div>
        )}

        {isAuthenticated && myClaims && myClaims.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
              {t("vcHistory")}
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {myClaims.map((c) => (
                <article key={c._id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{c.storeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.amountPaid ? eur(c.amountPaid) + " · " : ""}
                      {timeAgoLocal(c.createdAt)}
                    </p>
                  </div>
                  {c.status === "pending" && (
                    <Badge variant="secondary" className="rounded-full">
                      <Clock className="mr-1 size-3" /> {t("vcStatusPending")}
                    </Badge>
                  )}
                  {c.status === "approved" && (
                    <Badge className="rounded-full bg-emerald-500/15 text-emerald-700">
                      <BadgeCheck className="mr-1 size-3" /> {t("vcStatusApproved")}
                    </Badge>
                  )}
                  {c.status === "rejected" && (
                    <Badge variant="destructive" className="rounded-full">
                      <XCircle className="mr-1 size-3" /> {t("vcStatusRejected")}
                    </Badge>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </ShellPage>
  );
}

function timeAgoLocal(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
