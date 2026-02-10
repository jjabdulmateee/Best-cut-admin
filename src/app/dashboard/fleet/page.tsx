"use client";

import { useEffect, useState } from "react";
import { useBarbers } from "@/hooks/useBarbers";
import { BarberApplication, BarberStatus } from "@/lib/types/barber";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
    Users,
    Search,
    ChevronRight,
    UserCheck,
    UserX,
    Clock,
    ShieldAlert,
    Command,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

export default function FleetManagementPage() {
    const { barbers, loading, error } = useBarbers("all");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<BarberStatus | "all">("all");
    const [filteredBarbers, setFilteredBarbers] = useState<BarberApplication[]>([]);

    useEffect(() => {
        const filtered = barbers.filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
                b.email.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === "all" || b.accountStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
        setFilteredBarbers(filtered);
    }, [barbers, search, statusFilter]);

    const stats = {
        total: barbers.length,
        active: barbers.filter(b => b.accountStatus === "approved").length,
        pending: barbers.filter(b => b.accountStatus === "pending").length,
        risk: barbers.filter(b => (b.trust?.avgRating || 0) < 3.5 && (b.trust?.totalReviews || 0) >= 5).length
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background">
                <LoadingSpinner />
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Fleet Data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-emerald-600 rounded-lg text-white">
                            <Command size={20} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Fleet Management</h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Professional Barber Roster & Governance
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center bg-card border border-border p-1 rounded-xl overflow-x-auto max-w-[80vw]">
                        <Link href="/dashboard" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Overview</Link>
                        <Link href="/dashboard/fleet" className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white rounded-lg shadow-lg">Fleet</Link>
                        <Link href="/dashboard/map" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Map</Link>
                        <Link href="/dashboard/ops" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Ops</Link>
                        <Link href="/dashboard/trust" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Trust</Link>
                        <Link href="/dashboard/disputes" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Litigation</Link>
                    </nav>
                    <ThemeToggle />
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Fleet", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Active Partners", value: stats.active, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10" },
                    { label: "High Risk", value: stats.risk, icon: ShieldAlert, color: "text-danger", bg: "bg-danger/10" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or UID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-muted-foreground/50"
                    />
                </div>
                <div className="flex gap-2 bg-card border border-border p-2 rounded-2xl h-fit">
                    {(["all", "pending", "approved", "disabled"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${statusFilter === f
                                ? "bg-emerald-600 text-white shadow-lg"
                                : "text-muted-foreground hover:bg-muted/50"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Barber Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredBarbers.map((barber) => (
                        <motion.div
                            key={barber.uid}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-card border border-border rounded-3xl p-6 hover:border-emerald-500/50 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <Users size={80} />
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl uppercase shadow-lg">
                                            {barber.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{barber.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{barber.email}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest shrink-0 ${barber.accountStatus === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                                        barber.accountStatus === "pending" ? "bg-orange-500/20 text-orange-400" :
                                            "bg-danger/20 text-danger"
                                        }`}>
                                        {barber.accountStatus}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                    <div>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Service Levels</p>
                                        <div className="flex gap-2">
                                            <div className={`w-2 h-2 rounded-full ${barber.shopService === "approved" ? "bg-emerald-500" : "bg-muted"}`} title="Shop Service" />
                                            <div className={`w-2 h-2 rounded-full ${barber.doorstepService === "approved" ? "bg-teal-500" : "bg-muted"}`} title="Doorstep Service" />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Reputation</p>
                                        <div className="flex items-center justify-end gap-1">
                                            <UserCheck size={12} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-white">{barber.trust?.avgRating.toFixed(1) || "0.0"}</span>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href={`/dashboard/barber/${barber.uid}`}
                                    className="w-full py-3 bg-muted/50 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn border border-border hover:border-emerald-500"
                                >
                                    Manage Profile
                                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredBarbers.length === 0 && (
                <div className="text-center py-24 bg-card border-2 border-dashed border-border rounded-3xl">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                        <UserX size={32} className="text-muted-foreground" />
                    </div>
                    <h3 className="font-bold text-white">No matches found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Adjust your filters or search terms to find the barber you&apos;re looking for.</p>
                </div>
            )}
        </div>
    );
}
