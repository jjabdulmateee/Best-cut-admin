"use client";

import { useEffect, useState } from "react";
import { subscribeToBarbers } from "@/lib/services/barberService";
import { BarberApplication } from "@/lib/types/barber";
import { formatDistanceToNow } from "date-fns";
import { Activity, MapPin, Scissors, Info } from "lucide-react";

export const BarberActivityMonitor = () => {
    const [barbers, setBarbers] = useState<BarberApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const unsubscribe = subscribeToBarbers("all", (data) => {
            if (!isMounted) return;
            setBarbers(data);
            setLoading(false);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const isOnline = (lastActiveAt: any) => {
        if (!lastActiveAt) return false;
        const lastSeen = lastActiveAt.toDate ? lastActiveAt.toDate() : new Date(lastActiveAt);
        return (Date.now() - lastSeen.getTime()) < 30 * 60 * 1000;
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Supply Activity</h3>
                    <p className="text-[10px] text-muted-foreground">Real-time barber connection status</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-success uppercase bg-success/10 px-2 py-1 rounded">
                    <Activity size={10} className="animate-pulse" />
                    Live
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {barbers.map((barber) => (
                    <div key={barber.uid} className="p-4 border-b border-border/50 hover:bg-muted/20 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                    <Scissors size={14} />
                                </div>
                                <div className={`absolute -right-1 -bottom-1 w-2.5 h-2.5 rounded-full border-2 border-card ${isOnline(barber.lastActiveAt) ? 'bg-success' : 'bg-muted-foreground opacity-30'}`} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground leading-none">{barber.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter flex items-center gap-0.5">
                                        <MapPin size={8} />
                                        {barber.shopService === 'approved' ? 'Shop' : barber.doorstepService === 'approved' ? 'Doorstep' : 'Offline'}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground/50">
                                        {barber.lastActiveAt ? formatDistanceToNow(barber.lastActiveAt.toDate(), { addSuffix: true }) : 'Never active'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 text-muted-foreground hover:text-brand-400">
                                <Info size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
