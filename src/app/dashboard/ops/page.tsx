"use client";

import { useEffect, useState } from "react";
import { opsService } from "@/lib/services/opsService";
import { useAdminMode } from "@/context/AdminModeContext";
import { StatTile } from "@/components/Ops/StatTile";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
    Activity,
    Users,
    Scissors,
    Navigation,
    Clock,
    ShieldCheck,
    AlertCircle,
    Server,
    Zap
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookingMonitor } from "@/components/Ops/BookingMonitor";
import { ConfigPanel } from "@/components/Ops/ConfigPanel";
import { BarberActivityMonitor } from "@/components/Ops/BarberActivityMonitor";
import { AuditCenter } from "@/components/Ops/AuditCenter";
import { NotificationCenter } from "@/components/Ops/NotificationCenter";
import { riskService } from "@/lib/services/riskService";
import { BookingSimulator } from "@/components/Ops/BookingSimulator";

export default function OpsDashboard() {
    const { mode } = useAdminMode(); // 1. Get Mode
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            if (loading && isMounted) {
                // Use default stats if data doesn't load (e.g., permission issues)
                setStats({
                    activeBookings: 0,
                    totalBarbers: 0,
                    onlineBarbers: 0,
                    customersOnline: 0,
                    completionRate: 0,
                    newPartnersThisWeek: 0,
                    weeklyGross: 0
                });
                setLoading(false);
            }
        }, 3000);

        const unsubscribe = opsService.subscribeToHealth((data) => {
            if (!isMounted) return; // Prevent state updates after unmount
            clearTimeout(timeout);
            setStats(data);
            setLoading(false);
        });

        return () => {
            isMounted = false;
            clearTimeout(timeout);
            unsubscribe();
        };
    }, [loading]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background text-muted-foreground">
                <LoadingSpinner />
                <p className="mt-4 text-xs font-bold uppercase tracking-widest animate-pulse">Establishing Command Link...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`p-2 rounded-lg text-white ${mode === 'barber' ? 'bg-brand-600' : 'bg-purple-600'}`}>
                            <Server size={20} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Command HQ</h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        Platform Operational Status: HEALTHY ({mode === 'barber' ? 'Supply Scope' : 'Demand Scope'})
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center bg-card border border-border p-1 rounded-xl">
                        <Link href="/dashboard" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Overview</Link>
                        {mode === 'barber' && <Link href="/dashboard/fleet" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Fleet</Link>}
                        <Link href="/dashboard/map" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Map HQ</Link>
                        <Link href="/dashboard/ops" className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors text-foreground bg-muted rounded-lg shadow-sm">Ops Center</Link>
                        <Link href="/dashboard/trust" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Trust HQ</Link>
                        <Link href="/dashboard/disputes" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Litigation</Link>
                        <Link href="/dashboard/analytics" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
                    </nav>
                </div>
            </div>

            {/* Top Metrics Grid - Context Aware */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatTile
                    title="Active Bookings"
                    value={stats.activeBookings}
                    subtitle="Currently in progress"
                    icon={Activity}
                />

                {/* BARBER ONLY */}
                {mode === 'barber' && (
                    <StatTile
                        title="Barbers Online"
                        value={`${stats.onlineBarbers} / ${stats.totalBarbers}`}
                        subtitle="Last 30 minutes active"
                        icon={Scissors}
                        colorClass="text-brand-400"
                    />
                )}

                {/* CUSTOMER ONLY */}
                {mode === 'customer' && (
                    <StatTile
                        title="Customer Density"
                        value={stats.customersOnline}
                        subtitle="Active sessions"
                        icon={Users}
                        colorClass="text-purple-400"
                    />
                )}

                {/* Fallback/Shared Tile if one is hidden to maintain grid? Or just let it flow. 
                    Let's add 'Completion Rate' as shared but labeled differently if needed.
                */}
                <StatTile
                    title="Success Rate"
                    value={`${stats.completionRate}%`}
                    subtitle="Daily avg"
                    icon={ShieldCheck}
                    colorClass="text-success"
                />

                {/* Extra Shared Tile if grid is unbalanced? Active Bookings, Success Rate are 2. 
                    We have Barbers OR Customers. Total 3.
                    Let's add 'System Load' or 'Weekly Gross' to top?
                */}
                <StatTile
                    title="Weekly Volume"
                    value={`$${stats.weeklyGross.toLocaleString()}`}
                    subtitle="Platform Gross"
                    icon={Zap}
                    colorClass="text-blue-400"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Operations Monitor */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Booking Lifecycle Monitor</h3>
                                <p className="text-xs text-muted-foreground">Real-time status tracking for all platform trips</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded">Auto-Refresh Active</span>
                            </div>
                        </div>
                        <BookingMonitor />
                    </div>

                    {/* Supply and Audit (Phase F) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Only show Barber Activity in Barber Mode */}
                        {mode === 'barber' ? (
                            <div className="h-[400px]">
                                <BarberActivityMonitor />
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl p-6 h-[400px] flex flex-col justify-center text-center">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-500">
                                    <Users size={32} />
                                </div>
                                <h4 className="font-bold text-foreground uppercase tracking-widest text-xs">Customer Flow</h4>
                                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-2">Real-time customer session tracking and funnel analysis.</p>
                            </div>
                        )}

                        <BookingSimulator />
                    </div>

                    <AuditCenter />
                </div>

                {/* Right Sidebar: Platform Config & Audit */}
                <div className="space-y-8">
                    <ConfigPanel />

                    <div className="bg-muted/50 border border-border rounded-2xl p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-6">System Growth</h3>
                        <div className="space-y-4">
                            {/* Barber Only Growth Stats */}
                            {mode === 'barber' && (
                                <div className="p-3 bg-card border border-border rounded-xl">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">New Partners</p>
                                    <p className="text-xl font-bold text-foreground">+{stats.newPartnersThisWeek} <span className="text-[10px] text-success ml-1">This week</span></p>
                                </div>
                            )}

                            {/* Shared Financials */}
                            <div className="p-3 bg-card border border-border rounded-xl">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Weekly Gross</p>
                                <p className="text-xl font-bold text-foreground">${stats.weeklyGross.toLocaleString()} <span className="text-[10px] text-muted-foreground ml-1">USD</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
