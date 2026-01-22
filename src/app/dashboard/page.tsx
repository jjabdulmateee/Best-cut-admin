"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBarbers } from "@/hooks/useBarbers";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { BarberList } from "@/components/Dashboard/BarberList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import {
  ShieldAlert,
  Map as MapIcon,
  Zap,
  Scale,
  Activity,
  ShieldCheck,
  Cpu,
  BarChart3,
  Command,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { useAdminMode } from "@/context/AdminModeContext";

export default function DashboardPage() {
  const router = useRouter();
  const { mode } = useAdminMode();

  // Only fetch barbers if in Barber Mode to save reads/performance
  // Note: Hooks rules require us to call it always, but we can ignore the result or conditionally skip internal logic 
  // if the hook supports it. Since standard useBarbers might not support conditional fetch yet, 
  // we will call it but ignore data in Customer Mode. Ideally we refactor the hook later.
  const { barbers, loading, error } = useBarbers("all");

  const pendingBarbers = useMemo(
    () => barbers.filter((barber) => barber.status === "pending"),
    [barbers],
  );

  // DEFINITION: Barber Mode Modules (Legacy + Supply)
  const BARBER_MODULES = [
    {
      title: "FLEET INTELLIGENCE",
      subtitle: "Map HQ & Live Tracking",
      desc: "Neural network map tracking live barber locations and zone demand.",
      icon: <MapIcon className="text-blue-400" size={24} />,
      href: "/dashboard/map",
      color: "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
      badge: "LIVE"
    },
    {
      title: "OPS COMMAND",
      subtitle: "System Operations",
      desc: "High-level platform control, emergency freezes, and metrics.",
      icon: <Zap className="text-orange-400" size={24} />,
      href: "/dashboard/ops",
      color: "border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10",
      badge: "CTRL"
    },
    {
      title: "TRUST HQ",
      subtitle: "Reputation & Safety",
      desc: "AI-driven trust analysis, strike management, and security audits.",
      icon: <ShieldAlert className="text-brand-400" size={24} />,
      href: "/dashboard/trust",
      color: "border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10",
      badge: "SEC"
    },
    {
      title: "LITIGATION",
      subtitle: "Arbitration Center",
      desc: "Dispute resolution engine and escrow movement control.",
      icon: <Scale className="text-danger" size={24} />,
      href: "/dashboard/disputes",
      color: "border-danger/20 bg-danger/5 hover:bg-danger/10",
      badge: "GOV"
    },
    {
      title: "USER INTELLIGENCE",
      subtitle: "Analytics Center",
      desc: "Real-time user growth, retention, and engagement metrics.",
      icon: <BarChart3 className="text-cyan-400" size={24} />,
      href: "/dashboard/analytics",
      color: "border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10",
      badge: "DATA"
    },
    {
      title: "FLEET MANAGEMENT",
      subtitle: "Barber Directory",
      desc: "Full roster management, advanced status filtering, and profile access.",
      icon: <Command className="text-emerald-400" size={24} />,
      href: "/dashboard/fleet",
      color: "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
      badge: "ROSTER"
    }
  ];

  // DEFINITION: Customer Mode Modules (Demand Side)
  const CUSTOMER_MODULES = [
    {
      title: "MAP HQ",
      subtitle: "Customer Demand Map",
      desc: "Heatmap of customer activity and demand zones (No Barber Tracking).",
      icon: <MapIcon className="text-purple-400" size={24} />,
      href: "/dashboard/map", // Shared route, context aware
      color: "border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10",
      badge: "DEMAND"
    },
    {
      title: "USER INTELLIGENCE",
      subtitle: "Customer Directory",
      desc: "Search, filter, and manage customer accounts and risk profiles.",
      icon: <Users className="text-pink-400" size={24} />,
      href: "/dashboard/customers",
      color: "border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10",
      badge: "DIRECTORY"
    },
    {
      title: "TRUST HQ",
      subtitle: "Reputation & Safety",
      desc: "Manage customer bans, warnings, and safety reports.",
      icon: <ShieldAlert className="text-indigo-400" size={24} />,
      href: "/dashboard/trust",
      color: "border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10",
      badge: "SAFETY"
    },
    {
      title: "LITIGATION",
      subtitle: "Disputes & Refunds",
      desc: "Handle customer refund requests and chargeback disputes.",
      icon: <Scale className="text-red-400" size={24} />,
      href: "/dashboard/disputes",
      color: "border-red-500/20 bg-red-500/5 hover:bg-red-500/10",
      badge: "REFUNDS"
    },
    {
      title: "ANALYTICS",
      subtitle: "Customer Analytics",
      desc: "Real-time user growth, retention, and engagement metrics.",
      icon: <BarChart3 className="text-cyan-400" size={24} />,
      href: "/dashboard/analytics",
      color: "border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10",
      badge: "DATA"
    },
    {
      title: "OPS COMMAND",
      subtitle: "System Controls",
      desc: "Platform settings relevant to user apps (e.g. Terms, Versions).",
      icon: <Zap className="text-orange-400" size={24} />,
      href: "/dashboard/ops",
      color: "border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10",
      badge: "CTRL"
    }
  ];

  const visibleModules = mode === "barber" ? BARBER_MODULES : CUSTOMER_MODULES;

  return (
    <div className="space-y-12">
      {/* Module Grid - Context Aware */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {visibleModules.map((mod, i) => (
          <motion.div
            key={mod.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={mod.href} className={`block p-6 rounded-3xl border ${mod.color} transition-all duration-300 group relative overflow-hidden h-full`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {mod.icon}
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="p-3 rounded-2xl bg-background shadow-lg border border-border group-hover:scale-110 transition-transform duration-300">
                    {mod.icon}
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-foreground text-background">
                    {mod.badge}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground mb-1 uppercase">{mod.title}</p>
                  <h3 className="text-xl font-bold tracking-tight mb-2">{mod.subtitle}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {mod.desc}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* BARBER MODE CONTENT */}
      {mode === "barber" && (
        <>
          {/* Quick Stats & Live Data */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black tracking-[0.3em] text-muted-foreground uppercase flex items-center gap-2">
                <Activity size={14} className="text-brand-500" />
                Platform Bio-Metrics (Barber Supply)
              </h2>
            </div>
            <StatsCards barbers={barbers} />
          </section>

          {/* Main List */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black tracking-[0.3em] text-muted-foreground uppercase flex items-center gap-2">
                <ShieldCheck size={14} className="text-brand-500" />
                Pending Verification Stream
              </h2>
            </div>

            {loading ? (
              <div className="p-24 flex flex-col items-center justify-center space-y-4 border border-border border-dashed rounded-3xl bg-muted/20">
                <LoadingSpinner />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing with Central Intelligence...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-danger/30 bg-danger/10 text-danger p-6 flex items-start gap-4">
                  <ShieldAlert size={24} className="flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-widest text-xs underline decoration-danger/30">System Error: Access Revoked</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <BarberList
                items={pendingBarbers}
                onSelect={(id) => router.push(`/dashboard/barber/${id}`)}
                title="Active Petitions"
              />
            )}
          </section>
        </>
      )}

      {/* CUSTOMER MODE CONTENT (Placeholder) */}
      {mode === "customer" && (
        <>
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black tracking-[0.3em] text-muted-foreground uppercase flex items-center gap-2">
                <Activity size={14} className="text-purple-500" />
                Demand Analytics (Customer Scope)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-3xl bg-card border border-border/50 space-y-2 opacity-60 grayscale-[0.5]">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 mb-4" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black tracking-[0.3em] text-muted-foreground uppercase flex items-center gap-2">
                <Users size={14} className="text-purple-500" />
                Customer Activity Feed
              </h2>
            </div>

            <div className="p-24 flex flex-col items-center justify-center space-y-4 border border-border border-dashed rounded-3xl bg-purple-500/5">
              <Users className="text-purple-500/50" size={48} />
              <p className="text-xs font-bold uppercase tracking-widest text-purple-500/50">Customer Data Stream - Coming Phase B</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
