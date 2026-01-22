"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, signIn } = useAuth();
  const {
    isAdmin,
    loading: adminLoading,
    error: adminError,
  } = useAdminCheck();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminLoading && user && isAdmin) {
      router.replace("/dashboard");
    }
  }, [authLoading, adminLoading, isAdmin, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Signed in");
      router.replace("/dashboard");
    } catch {
      toast.error("Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const showAccessDenied = user && !adminLoading && !isAdmin;

  return (
    <div className="min-h-screen bg-brand-900 text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-brand-800 border border-brand-700 rounded-2xl shadow-xl p-8 space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
            Best Cut Admin
          </p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-gray-400">
            Use your admin email and password to access the dashboard.
          </p>
        </header>

        {(authLoading || adminLoading) && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <LoadingSpinner />
            <span>Checking your session…</span>
          </div>
        )}

        {showAccessDenied && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm p-3">
            Your account is not authorized for admin access.
          </div>
        )}

        {(authError || adminError) && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 text-danger text-sm p-3">
            {authError || adminError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-brand-700 border border-brand-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-success placeholder:text-gray-500"
              placeholder="admin@bestcut.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-brand-700 border border-brand-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-success placeholder:text-gray-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || authLoading || adminLoading}
            className="w-full rounded-lg bg-success hover:bg-green-600 transition-colors text-black font-semibold py-2 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <LoadingSpinner /> : null}
            <span>{submitting ? "Signing in..." : "Sign in"}</span>
          </button>
        </form>

        <p className="text-xs text-gray-500">
          Access is restricted to approved admins. Contact support if you need
          help.
        </p>
      </div>
    </div>
  );
}
