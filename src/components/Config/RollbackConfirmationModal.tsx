"use client";

import { ConfigVersion } from "@/lib/types/configVersion";
import { format } from "date-fns";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RollbackConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    targetVersion: ConfigVersion | null;
    isProcessing: boolean;
}

export function RollbackConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    targetVersion,
    isProcessing
}: RollbackConfirmationModalProps) {
    const [reason, setReason] = useState("");

    if (!isOpen || !targetVersion) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-full">
                                <RotateCcw size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Confirm Safe Rollback</h3>
                                <p className="text-sm text-muted-foreground">Restore platform behavior to a previous point.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-xl space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Target Version:</span>
                                <span className="font-mono font-bold">{targetVersion.versionId}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Created At:</span>
                                <span className="font-mono">{targetVersion.createdAt?.seconds ? format(new Date(targetVersion.createdAt.seconds * 1000), "MMM d, HH:mm") : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Created By:</span>
                                <span className="font-mono">{targetVersion.createdByAdminEmail || 'System'}</span>
                            </div>

                            <div className="pt-2 border-t border-border mt-2">
                                <p className="text-xs text-muted-foreground italic">"{targetVersion.changeReason}"</p>
                            </div>
                        </div>

                        <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl mb-6 flex gap-3">
                            <AlertTriangle className="shrink-0 text-orange-500" size={18} />
                            <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
                                <strong>Config Governance Rule:</strong> This action will NOT delete history. It will create a <span className="uppercase font-bold">new version</span> containing the snapshot from {targetVersion.versionId}. This ensures a complete audit trail.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rollback Reason (Required)</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Why are you rolling back? e.g. 'Previous update caused issue with refund calculation'"
                                className="w-full h-24 p-3 bg-background border border-border rounded-xl focus:ring-2 ring-brand-500 outline-none text-sm resize-none"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(reason)}
                            disabled={!reason.trim() || isProcessing}
                            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isProcessing ? "Rolling back..." : "Execute Rollback"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
