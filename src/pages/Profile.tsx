import { useQuery, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { XpBar, StreakDays } from "@/components/dealwar/XpBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Swords, Target, Trophy, Share2, Flame, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const COUNTRIES = ["PT", "ES", "FR", "DE", "IT", "UK", "US", "BR", "NL", "BE", "OTHER"];
const EMOJIS = ["🎯", "🦊", "🐺", "🦉", "🐯", "🦁", "🐻", "🦅", "⚡", "💎"];

export default function Profile() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const myProfile = useQuery(
    api.gamification.getMyProfile,
    isAuthenticated ? {} : "skip",
  );
  const myBadges = useQuery(
    api.gamification.listMyBadges,
    myProfile ? { profileId: myProfile._id } : "skip",
  );
  const allBadges = useQuery(api.gamification.listBadges, {});
  const myWars = useQuery(
    api.gamification.listXpHistory,
    myProfile ? { profileId: myProfile._id, limit: 8 } : "skip",
  );
  const updateProfile = useMutation(api.users.updateMyProfile);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("PT");
  const [bio, setBio] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (myProfile) {
      setUsername(myProfile.username);
      setCountry(myProfile.country ?? "PT");
      setBio(myProfile.bio ?? "");
      setEmoji(myProfile.avatarEmoji ?? "🎯");
    }
  }, [myProfile]);

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  if (!isAuthenticated) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <h1 className="text-xl font-black tracking-tight">Your hunter profile</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Sign in to see your XP, badges, streak and war history.
        </p>
        <Button className="mt-6 rounded-xl font-black" onClick={() => navigate("/auth?returnTo=%2Fprofile")}>
          Sign in
        </Button>
      </div>
    );
  }

  if (!myProfile) {
    return <Skeleton className="h-96 rounded-3xl" />;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ username, country, bio, avatarEmoji: emoji });
      toast.success("Profile updated.");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  const stats = [
    { label: "Wars created", value: myProfile.warsCreated, icon: Swords },
    { label: "Wars joined", value: myProfile.warsJoined, icon: Target },
    { label: "Wins", value: myProfile.wins, icon: Trophy },
    { label: "Discoveries", value: myProfile.discoveries, icon: ShieldCheck },
    { label: "Shares", value: myProfile.shares, icon: Share2 },
    { label: "Reputation", value: myProfile.reputation, icon: Flame },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* header card */}
      <section className="glass-strong rounded-3xl p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="glass-subtle flex size-16 items-center justify-center rounded-3xl text-3xl" aria-hidden>
            {myProfile.avatarEmoji ?? "🎯"}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black tracking-tight">@{myProfile.username}</h1>
            <p className="text-sm text-muted-foreground">
              {COUNTRIES.includes(myProfile.country ?? "") ? myProfile.country : "—"} ·{" "}
              {myProfile.reputation} reputation
            </p>
            {myProfile.bio && (
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">{myProfile.bio}</p>
            )}
          </div>
          <Button
            variant="outline"
            className="glass rounded-xl font-bold"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Cancel" : "Edit profile"}
          </Button>
        </div>

        <div className="mt-5 max-w-md">
          <XpBar levelInfo={myProfile.levelInfo} xp={myProfile.xp} />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
            Daily streak
          </p>
          <StreakDays count={myProfile.streakCount} />
        </div>
      </section>

      {/* edit form */}
      {editing && (
        <form onSubmit={handleSave} className="glass rounded-3xl p-6">
          <h2 className="font-black tracking-tight">Edit profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            You can edit identity fields only. XP, points and reputation are
            managed by the server.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={18}
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Avatar
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    aria-label={`Choose avatar ${e}`}
                    aria-pressed={emoji === e}
                    className={
                      emoji === e
                        ? "flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-xl ring-2 ring-ring"
                        : "glass-subtle flex size-10 items-center justify-center rounded-2xl text-xl"
                    }
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bio" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Bio
              </label>
              <Textarea
                id="bio"
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                className="mt-1"
              />
            </div>
          </div>
          <Button type="submit" className="mt-4 rounded-xl font-bold" disabled={saving}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save changes
          </Button>
        </form>
      )}

      {/* stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <s.icon className="mx-auto size-4 text-primary" aria-hidden />
            <p className="mt-1 text-2xl font-black tracking-tight">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* badges */}
      <section className="glass rounded-3xl p-6">
        <h2 className="font-black tracking-tight">Badges</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Earn badges through real activity. {myBadges?.length ?? 0} of{" "}
          {allBadges?.length ?? 10} unlocked.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {allBadges
            ?.sort((a, b) => a.sort - b.sort)
            .map((b) => {
              const owned = myBadges?.some((mb) => mb.badgeKey === b.key);
              return (
                <div
                  key={b.key}
                  className={
                    owned
                      ? "glass-strong flex flex-col items-center gap-1 rounded-2xl p-4 text-center"
                      : "glass-subtle flex flex-col items-center gap-1 rounded-2xl p-4 text-center opacity-50"
                  }
                  title={b.description}
                >
                  <span className="text-2xl" aria-hidden>{b.emoji}</span>
                  <span className="text-xs font-bold">{b.name}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {b.description}
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* recent XP */}
      <section className="glass rounded-3xl p-6">
        <h2 className="font-black tracking-tight">Recent XP activity</h2>
        {(myWars?.length ?? 0) === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            No XP activity yet. Join a war or submit a price to start earning.
          </p>
        )}
        <ul className="mt-3 flex flex-col">
          {myWars?.map((t) => (
            <li
              key={t._id}
              className="flex items-center justify-between border-b border-white/40 py-2 last:border-0"
            >
              <span className="text-sm">{t.reason}</span>
              <Badge variant="secondary" className="rounded-full font-bold">
                +{t.amount} XP
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
