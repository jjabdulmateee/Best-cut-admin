"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";
// Replaced broken import
import { Mail, Lock, ShieldCheck, ChevronRight } from "lucide-react";
import { ThemeToggle as StandaloneThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, signIn } = useAuth();
  const {
    isAdmin,
    loading: adminLoading,
    error: adminError,
  } = useAdminCheck();
  const [email, setEmail] = useState("demo@bestcut.com");
  const [password, setPassword] = useState("Hibye193");
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-600/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Theme Toggle Positioned Top Right */}
      <div className="absolute top-8 right-8 z-50">
        <StandaloneThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl p-10 space-y-8 relative z-10 backdrop-blur-xl"
      >
        <header className="space-y-4 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mx-auto w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 mb-6"
          >
            <ShieldCheck size={32} />
          </motion.div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-500">
              Best Cut Intelligence
            </p>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Admin Portal</h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Enter your credentials to access the command center.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {(authLoading || adminLoading) ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 space-y-4"
            >
              <LoadingSpinner />
              <p className="text-xs font-bold uppercase tracking-widest animate-pulse text-muted-foreground">Synchronizing Session...</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {showAccessDenied && (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 text-danger text-xs font-bold p-4 text-center uppercase tracking-wider">
                  Access Denied: Unrecognized Protocol
                </div>
              )}

              {(authError || adminError) && (
                <div className="rounded-2xl border border-danger/20 bg-danger/5 text-danger text-xs font-bold p-4 text-center uppercase tracking-wider">
                  {authError || adminError}
                </div>
              )}

              <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-center">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  a16z HAA Evaluator Notice: Demo credentials pre-filled for instant dashboard review. Click &apos;Sign In&apos; below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl bg-input text-foreground border border-border px-11 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-muted-foreground transition-all"
                      placeholder="name@bestcut.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl bg-input text-foreground border border-border px-11 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-muted-foreground transition-all caret-foreground"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting || authLoading || adminLoading}
                  className="w-full rounded-2xl bg-foreground text-background font-black uppercase tracking-widest py-4 flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-xl hover:shadow-brand-500/10"
                >
                  {submitting ? <LoadingSpinner /> : (
                    <>
                      <span>Unlock Dashboard</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
            Authorized Personnel Only <br />
            System Monitoring is Active
          </p>
        </footer>
      </motion.div>
    </div>
  );
}

