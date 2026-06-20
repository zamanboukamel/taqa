"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mark, Wordmark, Spinner } from "@/components/ui/brand";
import { PowerBar } from "@/components/ui/motion";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If email confirmation is OFF, we get a session immediately.
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
        // If confirmation is ON, no session yet.
        setNotice(
          "Account created. If email confirmation is enabled, check your inbox, then log in.",
        );
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-midnight lg:grid-cols-2">
      {/* ── Brand panel (desktop only) ─────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden border-r border-pitch-line lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 turf-grid opacity-50" />
        <div className="pointer-events-none absolute -top-32 -left-20 h-[520px] w-[520px] charge-glow" />

        <div className="relative">
          <Link href="/">
            <Wordmark />
          </Link>
        </div>

        <div className="relative">
          <p className="eyebrow">طاقة · energy</p>
          <h1 className="font-display mt-4 text-4xl font-semibold leading-tight text-white xl:text-5xl">
            Every athlete,
            <br />
            fuelled for the work.
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-mist">
            Sign in to build training-aware nutrition plans and share them with
            your squad in a single tap.
          </p>
          <div className="mt-8 max-w-xs">
            <PowerBar segments={16} />
          </div>
        </div>

        <p className="relative text-sm text-mist-2">
          AI nutrition for GCC sports academies
        </p>
      </aside>

      {/* ── Form panel ─────────────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center px-5 py-12">
        <div className="pointer-events-none absolute inset-0 turf-grid opacity-30 lg:hidden" />
        <div className="relative w-full max-w-sm">
          {/* Mobile-only brand */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/">
              <Wordmark />
            </Link>
          </div>

          <div className="tq-card p-7">
            <div className="flex items-center gap-3">
              <Mark className="h-9 w-9" />
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-sm text-mist">
                  {mode === "login"
                    ? "Director sign in"
                    : "Start fuelling your athletes"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label htmlFor="email" className="tq-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="tq-field"
                  placeholder="you@academy.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="tq-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="tq-field"
                  placeholder="••••••••"
                />
                <p className="mt-1.5 text-xs text-mist-2">At least 6 characters.</p>
              </div>

              {error && (
                <p role="alert" className="tq-alert-error">
                  {error}
                </p>
              )}
              {notice && <p className="tq-alert-ok">{notice}</p>}

              <button
                type="submit"
                disabled={loading}
                className="tq-btn tq-btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4 !border-midnight/30 !border-t-midnight" />
                    Please wait…
                  </>
                ) : mode === "login" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setNotice(null);
            }}
            className="mt-5 w-full text-center text-sm text-mist transition-colors hover:text-white"
          >
            {mode === "login" ? (
              <>
                New to Taqa?{" "}
                <span className="font-semibold text-charge">Create an account</span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span className="font-semibold text-charge">Sign in</span>
              </>
            )}
          </button>
        </div>
      </section>
    </main>
  );
}
