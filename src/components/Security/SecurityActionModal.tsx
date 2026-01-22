"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    impactDetail: string;
    actionLabel: string;
    variant?: "danger" | "warning";
}

export const SecurityActionModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    impactDetail,
    actionLabel,
    variant = "danger",
}: Props) => {
    const [step, setStep] = useState<1 | 2>(1);

    if (!isOpen) return null;

    const handleBack = () => {
        if (step === 2) setStep(1);
        else onClose();
    };

    const colorClasses =
        variant === "danger"
            ? "text-danger border-danger/30 bg-danger/5"
            : "text-warning border-warning/30 bg-warning/5";

    const buttonClasses =
        variant === "danger"
            ? "bg-danger hover:bg-red-600"
            : "bg-warning hover:bg-yellow-500 text-black";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg ${colorClasses} border`}>
                                <ShieldAlert size={20} />
                            </div>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-foreground">
                                {step === 1 ? title : "Final Confirmation Required"}
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {step === 1
                                    ? impactDetail
                                    : "Are you absolutely sure you want to proceed? This action may be irreversible and will be logged in the security audit trail."}
                            </p>
                        </div>

                        {step === 1 ? (
                            <div className={`p-4 rounded-xl border ${colorClasses} text-xs leading-relaxed`}>
                                <div className="flex gap-3">
                                    <AlertTriangle className="shrink-0" size={16} />
                                    <div>
                                        <p className="font-bold mb-1 uppercase tracking-wider">Step 1: Impact Assessment</p>
                                        <p>By proceeding, you acknowledge that the selected barber will be affected by this administrative override immediately.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-muted border border-border text-xs leading-relaxed">
                                <p className="font-bold text-foreground mb-1 italic">"I confirm that this action is necessary for platform integrity."</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleBack}
                                className="flex-1 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {step === 2 ? "GO BACK" : "CANCEL"}
                            </button>
                            <button
                                onClick={() => {
                                    if (step === 1) setStep(2);
                                    else onConfirm();
                                }}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${buttonClasses}`}
                            >
                                {step === 1 ? "PROCEED" : `YES, ${actionLabel.toUpperCase()}`}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
