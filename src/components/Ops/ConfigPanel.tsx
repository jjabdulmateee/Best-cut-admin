"use client";

import { useEffect, useState } from "react";
import { SystemConfig } from "@/lib/types/config";
import { opsService } from "@/lib/services/opsService";
import {
    ShieldAlert,
    ToggleLeft,
    ToggleRight,
    Loader2,
    Users,
    Navigation,
    Lock
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export const ConfigPanel = () => {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const unsubscribe = opsService.subscribeToConfig((data) => {
            if (!isMounted) return;
            setConfig(data);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const handleToggle = async (key: keyof SystemConfig, currentValue: boolean) => {
        setUpdating(key);
        try {
            await opsService.updateConfig("admin_user", { [key]: !currentValue });
            toast.success(`${key} status updated`);
        } catch (error) {
            toast.error(`Failed to update ${key}`);
        } finally {
            setUpdating(null);
        }
    };

    if (!config) return <div className="p-8 text-center opacity-30"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30 flex items-center gap-3">
                <Lock size={18} className="text-muted-foreground" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Platform Configuration</h3>
            </div>

            <div className="p-6 space-y-6">
                {/* Onboarding Toggle */}
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400 group-hover:bg-brand-500/20 transition-colors">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground">New Barber Onboarding</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Allow public registration applications</p>
                        </div>
                    </div>
                    <button
                        disabled={!!updating}
                        onClick={() => handleToggle('onboardingEnabled', config.onboardingEnabled)}
                        className={`transition-colors ${config.onboardingEnabled ? 'text-brand-500' : 'text-muted-foreground'}`}
                    >
                        {updating === 'onboardingEnabled' ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : config.onboardingEnabled ? (
                            <ToggleRight size={32} />
                        ) : (
                            <ToggleLeft size={32} />
                        )}
                    </button>
                </div>

                {/* Doorstep Toggle */}
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                            <Navigation size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground">Doorstep Marketplace</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Enable doorstep platform-wide</p>
                        </div>
                    </div>
                    <button
                        disabled={!!updating}
                        onClick={() => handleToggle('doorstepPlatformWide', config.doorstepPlatformWide)}
                        className={`transition-colors ${config.doorstepPlatformWide ? 'text-orange-500' : 'text-muted-foreground'}`}
                    >
                        {updating === 'doorstepPlatformWide' ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : config.doorstepPlatformWide ? (
                            <ToggleRight size={32} />
                        ) : (
                            <ToggleLeft size={32} />
                        )}
                    </button>
                </div>

                {/* Emergency System Freeze */}
                <div className="pt-6 border-t border-border mt-2">
                    <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldAlert size={16} className="text-danger" />
                            <p className="text-xs font-bold text-danger uppercase tracking-widest">Danger Zone</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-4">
                            Activating Emergency Freeze will immediately place the entire platform into read-only mode. All new bookings will be blocked.
                        </p>
                        <button
                            disabled={!!updating}
                            onClick={() => handleToggle('emergencyFreeze', config.emergencyFreeze)}
                            className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${config.emergencyFreeze
                                ? 'bg-success text-white'
                                : 'bg-danger text-white hover:bg-danger/90 shadow-lg shadow-danger/20'
                                }`}
                        >
                            {updating === 'emergencyFreeze' ? 'Processing...' : config.emergencyFreeze ? 'Lift System Freeze' : 'Activate System Freeze'}
                        </button>
                    </div>
                </div>

                <div className="text-[9px] text-muted-foreground font-mono flex items-center justify-center gap-2 pt-2">
                    <Clock size={10} />
                    Last Policy Change: {config.updatedAt?.toDate().toLocaleString()}
                </div>
            </div>
        </div>
    );
};

const Clock = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);
