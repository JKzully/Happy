"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";

function isInviteOrRecovery(type: string | null, user: { user_metadata?: Record<string, unknown> } | null) {
  return type === "invite" || type === "recovery" || user?.user_metadata?.needs_password;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check for error in hash fragment (e.g. expired invite link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashError = hashParams.get("error_code");
    if (hashError === "otp_expired") {
      setLinkExpired(true);
      return;
    }

    async function handleCallback() {
      // PKCE flow: invite/recovery emails redirect with ?code=xxx
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          if (isInviteOrRecovery(null, data.session.user)) {
            router.push("/auth/set-password");
          } else {
            router.push("/");
          }
          router.refresh();
          return;
        }
      }

      // Fallback: implicit flow — tokens in the URL hash
      const type = hashParams.get("type");

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          if (isInviteOrRecovery(type, session.user)) {
            router.push("/auth/set-password");
          } else {
            router.push("/");
          }
          router.refresh();
        }
      });

      // Also check if session is already established
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (isInviteOrRecovery(type, session.user)) {
          router.push("/auth/set-password");
        } else {
          router.push("/");
        }
        router.refresh();
      }

      return () => {
        subscription.unsubscribe();
      };
    }

    handleCallback();

    const timeout = setTimeout(() => setTimedOut(true), 10000);

    return () => {
      clearTimeout(timeout);
    };
  }, [router]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setError(error.message);
        setSending(false);
        return;
      }

      setSent(true);
      setSending(false);
    } catch {
      setError("Villa kom upp");
      setSending(false);
    }
  }

  if (linkExpired) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(96,165,250,0.06),transparent_50%)]" />

        <div className="relative w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/logos/happy-hydrate.svg"
              alt="Happy Hydrate"
              width={150}
              height={76}
              className="h-12 w-auto"
              priority
            />
            <p className="text-sm text-text-dim">Boðslinkur er útrunninn</p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-sm text-text-secondary">
                Nýr linkur hefur verið sendur á <strong>{email}</strong>. Athugaðu tölvupóstinn þinn.
              </p>
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-4">
              <p className="text-center text-sm text-text-secondary">
                Sláðu inn netfangið þitt til að fá nýjan link.
              </p>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                  Netfang
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 h-auto py-2.5"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={sending} className="w-full">
                {sending ? "Augnablik..." : "Senda nýjan link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (timedOut) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-text-dim" />
    </div>
  );
}
