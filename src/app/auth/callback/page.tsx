"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Supabase invite emails use implicit flow — tokens are in the URL hash.
    // The browser client auto-detects them and fires onAuthStateChange.
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (type === "invite") {
          router.push("/auth/set-password");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    });

    // Also check if session is already established
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (type === "invite") {
          router.push("/auth/set-password");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    });

    const timeout = setTimeout(() => setTimedOut(true), 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

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
