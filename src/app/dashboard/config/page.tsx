"use client";

import { useState, useEffect } from "react";
import { configService } from "@/lib/services/configService";
import { PlatformConfig } from "@/lib/types/platform";
import { ConfigEditor } from "@/components/Config/ConfigEditor";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { History, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";
import { ConfigVersion } from "@/lib/types/configVersion";

export default function ConfigControlCenter() {
    const [config, setConfig] = useState<PlatformConfig | null>(null);
    const [latestVersion, setLatestVersion] = useState<ConfigVersion | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Subscribe to active config
        const unsubscribeConfig = configService.subscribeToConfig((newConfig) => {
            setConfig(newConfig);
            setLoading(false);
        });

        // Subscribe to latest version metadata
        const unsubscribeHistory = configService.subscribeToVersionHistory((versions) => {
            if (versions.length > 0) {
                setLatestVersion(versions[0]);
            }
        }, 1);

        return () => {
            unsubscribeConfig();
            unsubscribeHistory();
        };
    }, []);

    const handleSave = async (updates: Partial<PlatformConfig>, reason: string) => {
        setSaving(true);
        try {
            await configService.updateConfig(updates, reason);
            toast.success("Configuration updated successfully");
        } catch (error: any) {
            console.error("Failed to update config:", error);
            toast.error(error.message || "Failed to update configuration");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-lg font-bold text-danger">Config Load Failed</h2>
                <p className="text-muted-foreground">Could not load platform configuration. System may be in fail-closed state.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Platform Governance</h1>
                    <p className="text-muted-foreground">
                        Configuration Control Center • <span className="text-emerald-500 font-bold">Active</span>
                    </p>
                </div>

                <Link
                    href="/dashboard/config/history"
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors font-bold text-sm"
                >
                    <History size={16} />
                    View Version History
                </Link>
            </div>

            {/* Current Version Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500/5 to-purple-500/5 border border-brand-500/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-brand-500/10 rounded-xl text-brand-500">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-brand-500 text-white px-2 py-0.5 rounded">
                                    {latestVersion?.versionId || "vUnknown"}
                                </span>
                                <span className="text-xs text-muted-foreground">Current Active Version</span>
                            </div>
                            <p className="text-sm font-medium">
                                Last updated by <span className="text-foreground font-bold">{latestVersion?.createdByAdminEmail || "System"}</span>
                            </p>
                            {latestVersion?.changeReason && (
                                <p className="text-xs text-muted-foreground italic mt-1">"{latestVersion.changeReason}"</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/50">
                        <Info size={14} />
                        Changes are versioned & immutable
                    </div>
                </div>
            </div>

            {/* Main Editor */}
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                <ConfigEditor
                    initialConfig={config}
                    onSave={handleSave}
                    isSaving={saving}
                />
            </div>
        </div>
    );
}
