import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/dealwar/Logo";
import { ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect, { replace: true });
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect, { replace: true });
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-bg flex min-h-screen flex-col items-center justify-center p-4">
      <Link to="/" className="mb-8" aria-label="Back to DEALWAR home">
        <Logo />
      </Link>

      <div className="glass-strong w-full max-w-md rounded-3xl border-white/70 p-8">
        {step === "signIn" ? (
          <>
            <div className="text-center">
              <span className="text-4xl" aria-hidden>⚔️</span>
              <h1 className="mt-3 text-2xl font-black tracking-tight">
                Join the battle
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Find a deal. Beat the price. Win the war.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="mt-6">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  className="pl-9"
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="mt-4 w-full rounded-xl font-black tracking-wide" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 size-4" />
                )}
                CONTINUE WITH EMAIL
              </Button>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
                  or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="glass mt-4 w-full rounded-xl font-bold"
              onClick={handleGuestLogin}
              disabled={isLoading}
            >
              <UserX className="mr-2 size-4" />
              Continue as Guest
            </Button>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
              By continuing you agree that XP and points are virtual with no
              monetary value. Price submissions are moderated before counting.
            </p>
          </>
        ) : (
          <>
            <div className="text-center">
              <span className="text-4xl" aria-hidden>📬</span>
              <h1 className="mt-3 text-2xl font-black tracking-tight">
                Check your email
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ve sent a 6-digit code to {step.email}
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="mt-6">
              <input type="hidden" name="email" value={step.email} />
              <input type="hidden" name="code" value={otp} />
              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                      const form = (e.target as HTMLElement).closest("form");
                      form?.requestSubmit();
                    }
                  }}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p className="mt-3 text-center text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                className="mt-5 w-full rounded-xl font-black tracking-wide"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    VERIFY CODE <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("signIn")}
                disabled={isLoading}
                className="mt-2 w-full rounded-xl"
              >
                Use different email
              </Button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        <Link to="/" className="font-semibold hover:text-foreground">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
