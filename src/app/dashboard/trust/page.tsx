"use client";

import { useEffect, useState } from "react";
import { subscribeToBarbers } from "@/lib/services/barberService";
import { BarberApplication } from "@/lib/types/barber";
import { BarberTrustCard } from "@/components/Trust/BarberTrustCard";
import { CustomerTrustCard } from "@/components/Trust/CustomerTrustCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ShieldAlert, TrendingDown, Filter, Search, Zap, AlertTriangle, Eye, UserX } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { auth } from "@/lib/firebase/config";
import { Cpu } from "lucide-react";
import { useAdminMode } from "@/context/AdminModeContext";
import { customerService } from "@/lib/services/customerService";

export default function TrustDashboard() {
    const { mode } = useAdminMode();

    // BARBER STATE
    const [barbers, setBarbers] = useState<BarberApplication[]>([]);

    // CUSTOMER STATE
    const [customers, setCustomers] = useState<any[]>([]);

    // SHARED STATE
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "high-risk" | "low-rating">("all");
    const [search, setSearch] = useState("");

    // -------------------------------------------------------------------------
    // 1. DATA FETCHING (Strictly Isolated)
    // -------------------------------------------------------------------------

    // Barber Fetcher
    useEffect(() => {
        if (mode !== 'barber') return;

        setLoading(true);
        const unsubscribe = subscribeToBarbers("all", (data) => {
            setBarbers(data);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Trust subscription error:", err);
            setError(err.message);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [mode]);

    // Customer Fetcher
    useEffect(() => {
        if (mode !== 'customer') return;

        setLoading(true);
        // In a real app we would subscribe, but for now we fetch once or set up interval
        const loadCustomers = async () => {
            try {
                // Fetch high risk by default for Trust HQ
                const risky = await customerService.getHighRiskCustomers(50);
                const strikes = await customerService.getRecentStrikes(50);

                // Merge and dedupe
                const map = new Map();
                [...risky, ...strikes].forEach(c => map.set(c.uid, c));

                setCustomers(Array.from(map.values()));
                setLoading(false);
            } catch (err: any) {
                console.error("Customer trust error:", err);
                setError(err.message || "Failed to load customer risk profile");
                setLoading(false);
            }
        };

        loadCustomers();
    }, [mode]);

    // -------------------------------------------------------------------------
    // 2. FILTERING LOGIC
    // -------------------------------------------------------------------------

    const filteredBarbers = barbers.filter(b => {
        const trust = b.trust || { avgRating: 0, totalReviews: 0 };
        const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.email.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === "high-risk") {
            return trust.totalReviews >= 5 && trust.avgRating < 3.5;
        }
        if (filter === "low-rating") {
            return trust.totalReviews > 0 && trust.avgRating < 4.0;
        }
        return true;
    });

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = (c.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === "high-risk") {
            // High risk for customers is Score > 75 OR Banned/Suspended
            return (c.riskScore || 0) > 75 || c.status === 'banned' || c.status === 'suspended';
        }
        // Reuse 'low-rating' filter key for 'Recent Strikes' in customer context
        if (filter === "low-rating") {
            return (c.strikes?.length || 0) > 0;
        }
        return true;
    });

    // -------------------------------------------------------------------------
    // 3. STATS CALCULATION
    // -------------------------------------------------------------------------

    // Barber Stats
    const highRiskBarbersCount = barbers.filter(b =>
        ((b.trust?.totalReviews || 0) >= 5 && (b.trust?.avgRating || 0) < 3.5) ||
        (b.strikes?.length || 0) >= 3 ||
        (b.reliabilityScore !== undefined && b.reliabilityScore < 0.6)
    ).length;

    // Customer Stats
    const highRiskCustomerCount = customers.filter(c => (c.riskScore || 0) > 80 || c.status === 'banned').length;
    const strikeCount = customers.reduce((acc, c) => acc + (c.strikes?.length || 0), 0);
    const bannedCount = customers.filter(c => c.status === 'banned').length;


    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`p-2 rounded-lg text-white ${mode === 'barber' ? 'bg-brand-600' : 'bg-indigo-600'}`}>
                            <ShieldAlert size={20} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Trust HQ</h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${mode === 'barber' ? 'bg-brand-400' : 'bg-indigo-400'}`} />
                        {mode === 'barber' ? 'Platform Reputation & Safety' : 'Customer Risk Governance'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center bg-card border border-border p-1 rounded-xl">
                        <Link href="/dashboard" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Overview</Link>
                        {mode === 'barber' && <Link href="/dashboard/fleet" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Fleet</Link>}
                        <Link href="/dashboard/map" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Map HQ</Link>
                        <Link href="/dashboard/ops" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Ops Center</Link>
                        <Link href="/dashboard/trust" className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors text-foreground bg-muted rounded-lg shadow-sm">Trust HQ</Link>
                        <Link href="/dashboard/disputes" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Litigation</Link>
                        <Link href="/dashboard/analytics" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
                    </nav>
                    <ThemeToggle />
                </div>
            </div>

            {/* BARBER VIEW */}
            {mode === 'barber' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-4 text-danger mb-2">
                                <ShieldAlert size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">High Risk Barbers</span>
                            </div>
                            <div className="text-4xl font-bold text-foreground">{highRiskBarbersCount}</div>
                            <p className="text-xs text-muted-foreground mt-2">Avg rating &lt; 3.5 with 5+ reviews</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-4 text-warning mb-2">
                                <TrendingDown size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Low Performers</span>
                            </div>
                            <div className="text-4xl font-bold text-foreground">
                                {barbers.filter(b => (b.trust?.avgRating || 0) < 4.0 && (b.trust?.totalReviews || 0) > 0).length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Barbers below 4.0 stars</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-4 text-danger mb-2">
                                <AlertTriangle size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform Strikes</span>
                            </div>
                            <div className="text-4xl font-bold text-foreground">
                                {barbers.reduce((acc, b) => acc + (b.strikes?.length || 0), 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Active disciplinary actions</p>
                        </div>
                    </div>

                    <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-danger/10 rounded-lg text-danger">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Fraud Detection Active</h4>
                                <p className="text-xs text-muted-foreground">Monitoring for rating surges and multi-account booking loops.</p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-danger uppercase tracking-widest bg-danger/10 px-3 py-1 rounded-full">
                            Real-time Scan: HEALTHY
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-xl">
                        <div className="flex gap-2">
                            <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === "all" ? "bg-brand-600 text-white shadow-lg" : "bg-muted text-muted-foreground"}`}>All Barbers</button>
                            <button onClick={() => setFilter("high-risk")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === "high-risk" ? "bg-danger text-white shadow-lg" : "bg-muted text-muted-foreground"}`}>High Risk</button>
                            <button onClick={() => setFilter("low-rating")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === "low-rating" ? "bg-warning text-black shadow-lg" : "bg-muted text-muted-foreground"}`}>Low Rating</button>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><LoadingSpinner /></div>
                    ) : filteredBarbers.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border"><p className="text-muted-foreground font-medium">No barbers found.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBarbers.map((barber) => (
                                <BarberTrustCard key={barber.uid} barber={barber} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* CUSTOMER VIEW */}
            {mode === 'customer' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-4 text-danger mb-2">
                                <ShieldAlert size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Critical Risk</span>
                            </div>
                            <div className="text-4xl font-bold text-foreground">{highRiskCustomerCount}</div>
                            <p className="text-xs text-muted-foreground mt-2">Score &gt; 80 or Banned</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-4 text-orange-500 mb-2">
                                <AlertTriangle size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Strikes</span>
                            </div>
                            <div className="text-4xl font-bold text-foreground">{strikeCount}</div>
                            <p className="text-xs text-muted-foreground mt-2">Cumulative infractions</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-4 text-muted-foreground mb-2">
                                <UserX size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Banned Users</span>
                            </div>
                            <div className="text-4xl font-bold text-foreground">{bannedCount}</div>
                            <p className="text-xs text-muted-foreground mt-2">Permanently blocked</p>
                        </div>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                <Eye size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Identity Verification</h4>
                                <p className="text-xs text-muted-foreground">Cross-referencing device fingerprints and payment methods.</p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">
                            System Active
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-xl">
                        <div className="flex gap-2">
                            <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === "all" ? "bg-indigo-600 text-white shadow-lg" : "bg-muted text-muted-foreground"}`}>All Alerts</button>
                            <button onClick={() => setFilter("high-risk")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === "high-risk" ? "bg-danger text-white shadow-lg" : "bg-muted text-muted-foreground"}`}>High Risk</button>
                            <button onClick={() => setFilter("low-rating")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === "low-rating" ? "bg-orange-500 text-white shadow-lg" : "bg-muted text-muted-foreground"}`}>Recent Strikes</button>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input type="text" placeholder="Search customer ID or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><LoadingSpinner /></div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border"><p className="text-muted-foreground font-medium">No high risk customers found.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCustomers.map((customer) => (
                                <CustomerTrustCard key={customer.uid} customer={customer} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
