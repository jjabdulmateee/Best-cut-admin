"use client";

import { useState, useEffect } from "react";
import { PlatformConfig } from "@/lib/types/platform";
import {
    Save,
    AlertTriangle,
    CheckCircle2,
    RotateCcw,
    ShieldAlert,
    DollarSign,
    TrendingDown,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfigEditorProps {
    initialConfig: PlatformConfig;
    onSave: (updates: Partial<PlatformConfig>, reason: string) => Promise<void>;
    isSaving: boolean;
}

export function ConfigEditor({ initialConfig, onSave, isSaving }: ConfigEditorProps) {
    const [config, setConfig] = useState<PlatformConfig>(initialConfig);
    const [reason, setReason] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Reset local state when initialConfig changes (e.g. after rollback or external update)
    useEffect(() => {
        setConfig(initialConfig);
        setReason("");
        setErrors({});
        setTouched({});
        setShowConfirmation(false);
    }, [initialConfig]);

    const validate = (fieldName: string, value: any) => {
        const newErrors = { ...errors };

        switch (fieldName) {
            case "platformFeePercent":
                if (value < 0 || value > 100) newErrors.platformFeePercent = "Must be between 0 and 100";
                else delete newErrors.platformFeePercent;
                break;
            case "maxSingleRefundAmount":
                if (value <= 0) newErrors.maxSingleRefundAmount = "Must be positive";
                else delete newErrors.maxSingleRefundAmount;
                break;
            case "largeRefundThreshold":
                if (value <= 0) newErrors.largeRefundThreshold = "Must be positive";
                else if (value >= config.maxSingleRefundAmount) newErrors.largeRefundThreshold = "Must be less than Max Refund Amount";
                else delete newErrors.largeRefundThreshold;
                break;
            case "reason":
                if (!value.trim()) newErrors.reason = "Change reason is required";
                else delete newErrors.reason;
                break;
        }

        setErrors(newErrors);
    };

    const handleChange = (field: keyof PlatformConfig, value: any) => {
        setConfig(prev => {
            const next = { ...prev, [field]: value };
            // Cross-field validation triggers
            if (field === "maxSingleRefundAmount") validate("largeRefundThreshold", next.largeRefundThreshold);
            return next;
        });
        setTouched(prev => ({ ...prev, [field]: true }));
        validate(field as string, value);
    };

    const handleSave = async () => {
        // Final validation
        if (!reason.trim()) {
            setErrors(prev => ({ ...prev, reason: "Change reason is required" }));
            return;
        }

        if (Object.keys(errors).length > 0) return;

        // Compute changed fields only
        const updates: Partial<PlatformConfig> = {};
        (Object.keys(config) as Array<keyof PlatformConfig>).forEach(key => {
            if (config[key] !== initialConfig[key]) {
                // @ts-ignore
                updates[key] = config[key];
            }
        });

        if (Object.keys(updates).length === 0) return;

        await onSave(updates, reason);
    };

    const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);

    return (
        <div className="space-y-8">
            {/* FINANCIAL CONTROLS */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Financial Controls</h3>
                        <p className="text-sm text-muted-foreground">Manage platform fees and revenue settings</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Platform Fee (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={config.platformFeePercent}
                                onChange={(e) => handleChange("platformFeePercent", parseFloat(e.target.value))}
                                className={`w-full bg-background border ${errors.platformFeePercent ? 'border-danger' : 'border-border'} rounded-xl p-3 focus:ring-2 ring-brand-500 outline-none transition-all`}
                            />
                            <span className="absolute right-4 top-3 text-muted-foreground font-bold">%</span>
                        </div>
                        {errors.platformFeePercent && <p className="text-xs text-danger font-medium">{errors.platformFeePercent}</p>}
                    </div>
                </div>
            </section>

            <div className="h-px bg-border/50" />

            {/* REFUND GUARDRAILS */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                        <TrendingDown size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Refund Guardrails</h3>
                        <p className="text-sm text-muted-foreground">Safety limits for automated and manual refunds</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Max Single Refund ($)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-muted-foreground font-bold">$</span>
                            <input
                                type="number"
                                value={config.maxSingleRefundAmount}
                                onChange={(e) => handleChange("maxSingleRefundAmount", parseFloat(e.target.value))}
                                className={`w-full bg-background border ${errors.maxSingleRefundAmount ? 'border-danger' : 'border-border'} rounded-xl p-3 pl-8 focus:ring-2 ring-brand-500 outline-none transition-all`}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Hard limit. Refunds above this are blocked.</p>
                        {errors.maxSingleRefundAmount && <p className="text-xs text-danger font-medium">{errors.maxSingleRefundAmount}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dual Approval Threshold ($)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-muted-foreground font-bold">$</span>
                            <input
                                type="number"
                                value={config.largeRefundThreshold}
                                onChange={(e) => handleChange("largeRefundThreshold", parseFloat(e.target.value))}
                                className={`w-full bg-background border ${errors.largeRefundThreshold ? 'border-danger' : 'border-border'} rounded-xl p-3 pl-8 focus:ring-2 ring-brand-500 outline-none transition-all`}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Refunds above this require second admin approval.</p>
                        {errors.largeRefundThreshold && <p className="text-xs text-danger font-medium">{errors.largeRefundThreshold}</p>}
                    </div>

                    <div className="space-y-2 col-span-full">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Refund Presets (%)</label>
                        <div className="flex gap-2 flex-wrap">
                            {(config.refundPresets || []).map((preset, idx) => (
                                <div key={idx} className="px-3 py-1 bg-muted rounded-full text-xs font-bold">
                                    {preset}%
                                </div>
                            ))}
                            <p className="text-[10px] text-muted-foreground w-full mt-1">
                                * Presets are currently read-only in this version.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-px bg-border/50" />

            {/* SAFETY & GOVERNANCE */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Safety & Governance</h3>
                        <p className="text-sm text-muted-foreground">Emergency controls and operational overrides</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-orange-500">Emergency Freeze</h4>
                        <p className="text-xs text-orange-500/70">
                            {config.emergencyFreeze
                                ? "SYSTEM FROZEN. All sensitive operations suspended."
                                : "System active. Normal operations allowed."}
                        </p>
                    </div>
                    <button
                        onClick={() => handleChange("emergencyFreeze", !config.emergencyFreeze)}
                        className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${config.emergencyFreeze
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                            : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                            }`}
                    >
                        {config.emergencyFreeze ? "Deactivate Freeze" : "Activate Freeze"}
                    </button>
                </div>
            </section>

            {/* ACTION BAR */}
            <AnimatePresence>
                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 inset-x-0 mx-auto max-w-2xl p-4 bg-background/80 backdrop-blur-xl border border-brand-500/30 shadow-2xl shadow-brand-500/10 rounded-2xl z-50 flex flex-col gap-4"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
                                <Info size={20} />
                            </div>
                            <div className="flex-1 space-y-3">
                                <h4 className="font-bold">Unsaved Changes</h4>
                                <p className="text-xs text-muted-foreground">
                                    You have modified the platform configuration. These changes will be versioned and immutable once saved.
                                </p>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-500">Change Reason (Required)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => {
                                            setReason(e.target.value);
                                            if (e.target.value.trim()) {
                                                const newErrors = { ...errors };
                                                delete newErrors.reason;
                                                setErrors(newErrors);
                                            }
                                        }}
                                        placeholder="Why are you making these changes? E.g., 'Annual fee adjustment' or 'Emergency fraudulent pattern detected'"
                                        className={`w-full bg-background border ${errors.reason ? 'border-danger' : 'border-border'} rounded-lg p-2 text-sm focus:ring-1 ring-brand-500 outline-none h-20 resize-none`}
                                    />
                                    {errors.reason && <p className="text-[10px] text-danger font-bold">{errors.reason}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
                            <button
                                onClick={() => setConfig(initialConfig)}
                                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors"
                                disabled={isSaving}
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !!errors.reason || Object.keys(errors).length > 0}
                                className="px-6 py-2 rounded-lg bg-brand-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
                            >
                                {isSaving ? <RotateCcw className="animate-spin" size={14} /> : <Save size={14} />}
                                {isSaving ? "Publishing..." : "Publish Version"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
