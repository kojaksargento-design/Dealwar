import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Swords, Info } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const CATEGORIES = [
  "Tech",
  "Home",
  "Fitness",
  "Fashion",
  "Gaming",
  "Beauty",
  "Kids",
  "Other",
];
const COUNTRIES = [
  { code: "PT", label: "Portugal" },
  { code: "ES", label: "Spain" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "IT", label: "Italy" },
  { code: "UK", label: "United Kingdom" },
  { code: "US", label: "USA" },
];

export default function CreateWar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const createWar = useMutation(api.wars.create);
  const touchStreak = useMutation(api.users.touchStreak);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Tech");
  const [priceStr, setPriceStr] = useState("");
  const [country, setCountry] = useState("PT");
  const [days, setDays] = useState("7");
  const [sending, setSending] = useState(false);

  const price = parseFloat(priceStr.replace(",", "."));
  const valid =
    title.trim().length >= 6 &&
    productName.trim().length >= 2 &&
    Number.isFinite(price) &&
    price > 0;

  if (!isAuthenticated) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <h1 className="text-xl font-black tracking-tight">Sign in to start a war</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Creating a Price War is a hunter action — you'll earn +10 XP for
          starting one.
        </p>
        <Button
          className="mt-6 rounded-xl font-black tracking-wide"
          onClick={() => navigate("/auth?returnTo=%2Fcreate")}
        >
          <Swords className="mr-2 size-4" /> SIGN IN TO CREATE
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const warId = await createWar({
        title: title.trim(),
        description: description.trim() || undefined,
        productName: productName.trim(),
        categoryName: category,
        originalPrice: Math.round(price * 100),
        currency: "EUR",
        country,
        days: parseInt(days, 10),
      });
      await touchStreak({});
      toast.success("War created! +10 XP", {
        description: "Your Price War is live. Hunters can now try to beat your price.",
      });
      navigate(`/war/${warId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create war.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Create a Price War</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the price to beat. The community tries to find it lower. (+10 XP)
        </p>
      </header>

      <form onSubmit={handleSubmit} className="glass rounded-3xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              War title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wireless Headphones X200 — Beat €149"
              required
              minLength={6}
              maxLength={90}
              className="mt-1"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">6–90 characters.</p>
          </div>

          <div>
            <label htmlFor="product" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Product name
            </label>
            <Input
              id="product"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Wireless Headphones X200"
              required
              minLength={2}
              maxLength={80}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Original price (€)
            </label>
            <Input
              id="price"
              inputMode="decimal"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="149.99"
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Country
            </label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              War duration
            </label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Days" />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Description (optional)
            </label>
            <Textarea
              id="desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context, model, where you saw the price…"
              maxLength={400}
              className="mt-1"
            />
          </div>
        </div>

        <div className="glass-subtle mt-5 flex items-start gap-2 rounded-2xl p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          Prices are validated by moderators. Never invent prices — every
          submission is checked before counting toward the war.
        </div>

        <Button
          type="submit"
          className="mt-5 w-full rounded-xl font-black tracking-wide"
          disabled={sending || !valid}
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Creating…
            </>
          ) : (
            <>
              <Swords className="mr-2 size-4" /> START THE WAR
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
