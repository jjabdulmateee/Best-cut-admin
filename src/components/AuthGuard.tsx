"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { LoadingSpinner } from "./LoadingSpinner";
import { ShieldAlert, Cpu, Lock, Key } from "lucide-react";
import { auth } from "@/lib/firebase/config";

type Props = {
  children: ReactNode;
};

export const AuthGuard = ({ children }: Props) => {
  const router = useRouter();
  const { user, loading: authLoading, error: authError } = useAuth();
  const {
    isAdmin,
    loading: adminLoading,
    error: adminError,
  } = useAdminCheck();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
    }
  }, [authLoading, router, user]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500 rounded-full blur-2xl opacity-20 animate-pulse" />
          <div className="p-4 bg-card border border-border rounded-3xl relative z-10">
            <LoadingSpinner />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Establishing Secure Uplink</p>
          <p className="text-[10px] font-mono text-brand-500 opacity-50">BYPASS_PROTOCOL_PENDING</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (authError || adminError || !isAdmin) {
    const errorMsg = authError || adminError || "Access denied. Admin approval required.";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
          {/* Locked UI */}
          <div className="rounded-3xl border border-border bg-card p-12 space-y-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 p-32 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-colors" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="p-5 bg-brand-500/20 rounded-3xl text-brand-400 border border-brand-500/20 shadow-lg shadow-brand-500/10">
                <Lock size={40} className="group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-foreground italic flex items-center gap-3">
                  <ShieldAlert className="text-brand-500" size={28} />
                  System Lock: Level 4
                </h2>
                <p className="text-muted-foreground text-sm uppercase tracking-wider font-bold opacity-60 mt-1">Platform Kernel Protected</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-widest">
                    <Key size={14} />
                    Authentication Report
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your identity is recognized, but your signature has not been authorized in the <span className="text-foreground font-bold italic">Admin Core</span>. Please provide your signature to the Root Administrator.
                  </p>
                </div>

                <div className="bg-background/50 p-6 rounded-2xl border border-border font-mono text-xs break-all shadow-inner group-hover:border-brand-500/30 transition-colors">
                  <span className="text-muted-foreground block mb-2 uppercase tracking-widest font-bold text-[9px]">Identity Signature:</span>
                  <span className="text-success select-all text-sm font-bold tracking-tight">{auth.currentUser?.uid || "SIGNATURE_MISSING"}</span>
                </div>

                <button
                  onClick={() => router.replace('/')}
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline decoration-brand-500/30 underline-offset-4"
                >
                  Return to Gateway
                </button>
              </div>

              <div className="bg-muted/30 p-8 rounded-3xl border border-border space-y-5">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-brand-500" />
                  <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Provisioning Protocol</p>
                </div>
                <div className="space-y-4">
                  {[
                    "Navigate to Firebase Console",
                    "Target 'admins' Collection",
                    "Insert Document: [Signature Left]",
                    "Set Field: 'email' = (Current Account)"
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-xs font-bold text-foreground">
                      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-brand-500/20 text-brand-400 text-[10px] border border-brand-500/20">{idx + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
