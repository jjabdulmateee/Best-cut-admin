"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminMode } from "@/context/AdminModeContext";
import { useBarbers } from "@/hooks/useBarbers";
import { customerService } from "@/lib/services/customerService";
import { Customer } from "@/lib/types/customer";
import {
    Users, Activity, Calendar, Zap,
    BarChart3, UserPlus, TrendingUp, Clock
} from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth, isAfter, subMinutes } from "date-fns";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AnalyticsDashboard() {
    const { mode } = useAdminMode();

    // Barbers Data (Supply)
    const { barbers, loading: barbersLoading } = useBarbers("all");

    // Customers Data (Demand)
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customersLoading, setCustomersLoading] = useState(true);

    useEffect(() => {
        if (mode === 'customer') {
            const fetchCustomers = async () => {
                try {
                    const data = await customerService.getAllCustomers(1000);
                    setCustomers(data);
                } catch (err) {
                    console.error("Failed to fetch customer stats", err);
                } finally {
                    setCustomersLoading(false);
                }
            };
            fetchCustomers();
        }
    }, [mode]);

    const activeData = mode === 'barber' ? barbers : customers;
    const isLoading = mode === 'barber' ? barbersLoading : customersLoading;

    // --- METRIC CALCULATIONS (REAL DATA) ---
    const stats = useMemo(() => {
        const now = new Date();
        const startDay = startOfDay(now);
        const startWk = startOfWeek(now);
        const startMth = startOfMonth(now);
        const onlineThreshold = subMinutes(now, 5); // 5 mins active threshold

        const getDate = (item: any) => {
            if (!item.createdAt) return new Date(0);
            if (item.createdAt.toDate) return item.createdAt.toDate();
            return new Date(item.createdAt);
        };
        const getLastActive = (item: any) => {
            if (!item.lastActive) return new Date(0);
            if (item.lastActive.toDate) return item.lastActive.toDate();
            return new Date(item.lastActive);
        }

        return {
            total: activeData.length,
            online: activeData.filter(i => isAfter(getLastActive(i), onlineThreshold)).length,
            active24h: activeData.filter(i => isAfter(getLastActive(i), subMinutes(now, 1440))).length,
            monthlyActive: activeData.filter(i => isAfter(getLastActive(i), subMinutes(now, 43200))).length,
            newToday: activeData.filter(i => isAfter(getDate(i), startDay)).length,
            newWeek: activeData.filter(i => isAfter(getDate(i), startWk)).length,
            newMonth: activeData.filter(i => isAfter(getDate(i), startMth)).length,
            engagement: activeData.length > 0
                ? Math.round((activeData.filter(i => isAfter(getLastActive(i), subMinutes(now, 43200))).length / activeData.length) * 100)
                : 0
        };
    }, [activeData]);

    if (isLoading && mode === 'barber') return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    // Note: Customer loading might be fast or slow, we can show spinner or just transition. Kept simple.

    return (
        <div className="min-h-screen bg-background p-8 space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg text-white ${mode === 'barber' ? 'bg-cyan-600' : 'bg-purple-600'}`}>
                        <BarChart3 size={24} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                        Analytics Center
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Real-time User Metrics & Insights ({mode === 'barber' ? 'Supply Side' : 'Demand Side'})
                </p>
            </div>

            {/* 8-Card Grid (Screenshot Replication) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. TOTAL USERS */}
                <MetricCard
                    icon={Users} color="text-blue-500" bg="bg-blue-500/10"
                    label={mode === 'barber' ? "Total Barbers" : "Total Customers"}
                    value={stats.total}
                    subtext={`${stats.total} registered in system`}
                />

                {/* 2. ONLINE NOW */}
                <MetricCard
                    icon={Zap} color="text-success" bg="bg-success/10"
                    label="Online Now"
                    value={stats.online}
                    subtext="Active in last 5 minutes"
                />

                {/* 3. ACTIVE USERS (24h) */}
                <MetricCard
                    icon={Activity} color="text-indigo-500" bg="bg-indigo-500/10"
                    label="Active Users"
                    value={stats.active24h}
                    subtext="Active in last 24 hours"
                />

                {/* 4. MONTHLY ACTIVE */}
                <MetricCard
                    icon={Calendar} color="text-purple-500" bg="bg-purple-500/10"
                    label="Monthly Active"
                    value={stats.monthlyActive}
                    subtext="Active in last 30 days"
                />

                {/* 5. NEW TODAY */}
                <MetricCard
                    icon={UserPlus} color="text-orange-500" bg="bg-orange-500/10"
                    label="New Today"
                    value={stats.newToday}
                    subtext="Registered today"
                />

                {/* 6. NEW THIS WEEK */}
                <MetricCard
                    icon={TrendingUp} color="text-emerald-500" bg="bg-emerald-500/10"
                    label="New This Week"
                    value={stats.newWeek}
                    subtext="Last 7 days"
                />

                {/* 7. NEW THIS MONTH */}
                <MetricCard
                    icon={BarChart3} color="text-cyan-500" bg="bg-cyan-500/10"
                    label="New This Month"
                    value={stats.newMonth}
                    subtext="Last 30 days"
                />

                {/* 8. ENGAGEMENT RATE */}
                <MetricCard
                    icon={Clock} color="text-pink-500" bg="bg-pink-500/10"
                    label="Engagement Rate"
                    value={`${stats.engagement}%`}
                    subtext="Active / Total users"
                />

            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, color, bg, label, value, subtext }: any) {
    return (
        <div className="p-8 rounded-[2rem] bg-card border border-border flex flex-col justify-between h-48 transition-all hover:scale-[1.02] hover:shadow-lg">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color} mb-4`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</p>
                <h3 className="text-3xl font-black text-foreground tracking-tight">{value}</h3>
                <p className="text-xs text-muted-foreground mt-2 font-medium opacity-80">{subtext}</p>
            </div>
        </div>
    );
}
