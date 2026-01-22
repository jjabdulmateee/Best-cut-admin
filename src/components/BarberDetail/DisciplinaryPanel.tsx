"use client";

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Gavel, History, Scale } from 'lucide-react';
import { BarberApplication } from '@/lib/types/barber';
import { securityService } from '@/lib/services/securityService';
import toast from 'react-hot-toast';

interface DisciplinaryPanelProps {
    barber: BarberApplication;
    onUpdate: () => void;
}

export const DisciplinaryPanel = ({ barber, onUpdate }: DisciplinaryPanelProps) => {
    const [loading, setLoading] = useState(false);
    const [penaltyAmount, setPenaltyAmount] = useState("");
    const [reason, setReason] = useState("");

    const handleApplyStrike = async (severity: 'low' | 'medium' | 'high') => {
        const r = window.prompt(`Reason for ${severity} severity strike (Mandatory):`);
        if (!r) return;

        setLoading(true);
        try {
            await securityService.applyStrike({
                targetId: barber.uid,
                targetType: 'barber',
                reason: r,
                severity
            });
            toast.success("Strike applied successfully");
            onUpdate();
        } catch (error) {
            toast.error("Failed to apply strike");
        } finally {
            setLoading(false);
        }
    };

    const handlePenalty = async () => {
        if (!penaltyAmount || !reason) {
            toast.error("Amount and Reason required");
            return;
        }

        setLoading(true);
        try {
            await securityService.issuePenalty({
                targetId: barber.uid,
                amount: parseFloat(penaltyAmount),
                reason
            });
            toast.success("Financial penalty issued");
            setPenaltyAmount("");
            setReason("");
            onUpdate();
        } catch (error) {
            toast.error("Failed to issue penalty");
        } finally {
            setLoading(false);
        }
    };

    const getTrustColor = (level: string = 'green') => {
        switch (level) {
            case 'green': return 'text-success bg-success/10 border-success/20';
            case 'yellow': return 'text-warning bg-warning/10 border-warning/20';
            case 'red': return 'text-danger bg-danger/10 border-danger/20';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-danger/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-danger">
                    <ShieldAlert size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Enforcement Center</h3>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getTrustColor(barber.trustLevel)}`}>
                    Trust: {barber.trustLevel || 'GREEN'}
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Strikes */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Strike Counter</label>
                        <span className="text-xl font-mono font-bold">{barber.strikeCount || 0} / 3</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={loading}
                            onClick={() => handleApplyStrike('low')}
                            className="flex-1 py-2 bg-warning/10 text-warning border border-warning/20 rounded-lg text-[10px] font-bold hover:bg-warning/20 transition-all"
                        >
                            + MINOR STRIKE
                        </button>
                        <button
                            disabled={loading}
                            onClick={() => handleApplyStrike('high')}
                            className="flex-1 py-2 bg-danger/10 text-danger border border-danger/20 rounded-lg text-[10px] font-bold hover:bg-danger/20 transition-all"
                        >
                            + MAJOR STRIKE
                        </button>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Financial Penalty */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Scale size={14} />
                        <label className="text-[10px] font-bold uppercase">Financial Deduction</label>
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <input
                                type="number"
                                value={penaltyAmount}
                                onChange={(e) => setPenaltyAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-background border border-border rounded-lg pl-6 pr-3 py-2 text-sm focus:border-danger outline-none transition-all"
                            />
                        </div>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason for penalty..."
                            className="w-full h-20 bg-background border border-border rounded-xl p-3 text-xs focus:border-danger outline-none resize-none transition-all"
                        />
                        <button
                            onClick={handlePenalty}
                            disabled={loading}
                            className="w-full py-2 bg-danger text-white rounded-lg text-xs font-bold hover:bg-danger/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Gavel size={14} />
                            ISSUE PENALTY
                        </button>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* History Link */}
                <button className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    <History size={14} />
                    View Enforcement Logs
                </button>
            </div>
        </div>
    );
};
