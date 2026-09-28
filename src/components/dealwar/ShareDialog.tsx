import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { eur } from "@/lib/format";
import { ArrowDown, Share2, Copy, Check, MessageCircle, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";

export function ShareDialog({
  warTitle,
  originalPrice,
  bestPrice,
  slug,
  onShared,
  trigger,
}: {
  warTitle: string;
  originalPrice: number;
  bestPrice: number;
  slug: string;
  onShared?: (channel: string) => void;
  trigger?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  // Viral loop: every shared victory carries the hunter's invite code, so
  // friends who sign up through it count as recruits (+XP both ways).
  const myStats = useQuery(api.referrals.getMyStats, {});
  const code = myStats?.code ?? null;
  const url = code
    ? `${window.location.origin}/war/${slug}?ref=${code}`
    : `${window.location.origin}/war/${slug}`;
  const text = `I BEAT THE WAR — ${warTitle}: ${eur(originalPrice)} ↓ ${eur(bestPrice)}. You can beat me? ⚔️ DEALWAR`;

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

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "DEALWAR", text, url });
        onShared?.("native");
      } catch {
        /* user cancelled */
      }
    } else {
      await copyLink();
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      toast.success("Link copied!");
      onShared?.("copy");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong rounded-3xl border-white/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5 text-primary" /> Share your victory
          </DialogTitle>
          <DialogDescription>
            Challenge your friends — can they beat your price?
          </DialogDescription>
        </DialogHeader>

        {/* Win card */}
        <div className="glass rounded-3xl border-white/70 p-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            ⚔️ DEALWAR
          </p>
          <p className="mt-2 text-sm font-bold uppercase tracking-widest">
            I BEAT THE WAR
          </p>
          <p className="mt-3 text-2xl font-black text-muted-foreground line-through decoration-2">
            {eur(originalPrice)}
          </p>
          <ArrowDown className="mx-auto size-5 text-emerald-500" />
          <p className="text-4xl font-black tracking-tighter text-emerald-600">
            {eur(bestPrice)}
          </p>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            &ldquo;You can beat me?&rdquo;
          </p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em]">
            DEALWAR
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            className="col-span-2 rounded-xl font-bold"
            onClick={nativeShare}
          >
            <Share2 className="mr-2 size-4" /> Share
          </Button>
          {channels.map((c) => (
            <a
              key={c.id}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onShared?.(c.id)}
              className="glass-subtle col-span-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-primary/10"
            >
              <c.icon className="size-4" /> {c.label}
            </a>
          ))}
          <Button variant="outline" className="rounded-xl font-semibold" onClick={copyLink}>
            {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
            {copied ? "Copied" : "Copy Link"}
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          Instagram sharing is not available via web APIs on this device.
        </p>
      </DialogContent>
    </Dialog>
  );
}
