"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Lykilorð verður að vera a.m.k. 6 stafir");
      return;
    }

    if (password !== confirm) {
      setError("Lykilorð stemma ekki");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Villa kom upp");
      setLoading(false);
    }
  }

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
          <p className="text-sm text-text-dim">Veldu lykilorð fyrir aðganginn þinn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
              Lykilorð
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 h-auto py-2.5"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-text-secondary">
              Staðfesta lykilorð
            </label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Augnablik..." : "Vista lykilorð"}
          </Button>
        </form>
      </div>
    </div>
  );
}
