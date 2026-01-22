import { useState } from "react";
import { ServiceStatus } from "@/lib/types/barber";
import { LoadingSpinner } from "../LoadingSpinner";

type Props = {
    serviceName: string;
    status: ServiceStatus;
    onUpdate: (status: "approved" | "rejected", reason?: string) => Promise<void>;
    disabled?: boolean;
};

export const ServiceControl = ({ serviceName, status, onUpdate, disabled }: Props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleAction = async (newStatus: "approved" | "rejected") => {
        if (newStatus === "rejected" && !isEditing) {
            setIsEditing(true);
            return;
        }

        if (newStatus === "rejected" && !reason.trim()) {
            return; // Force reason
        }

        setProcessing(true);
        try {
            await onUpdate(newStatus, reason);
            setIsEditing(false);
            setReason("");
        } finally {
            setProcessing(false);
        }
    };

    const badgeColors: Record<ServiceStatus, string> = {
        pending: "bg-warning/10 text-warning",
        approved: "bg-success/10 text-success",
        rejected: "bg-danger/10 text-danger",
    };

    return (
        <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{serviceName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[status]}`}>
                        {status.toUpperCase()}
                    </span>
                </div>

                <div className="flex gap-2">
                    {status !== "approved" && (
                        <button
                            onClick={() => handleAction("approved")}
                            disabled={disabled || processing}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-success text-brand-900 hover:bg-green-500 disabled:opacity-50"
                        >
                            Approve
                        </button>
                    )}

                    {status !== "rejected" && (
                        <button
                            onClick={() => handleAction("rejected")}
                            disabled={disabled || processing}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-danger text-danger hover:bg-danger/10 disabled:opacity-50"
                        >
                            Reject
                        </button>
                    )}

                    {processing && <LoadingSpinner />}
                </div>
            </div>

            {isEditing && (
                <div className="space-y-2 pt-2 border-t border-brand-700 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm text-gray-400">Reason for rejection *</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full h-24 rounded-lg bg-brand-900 border border-brand-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-danger"
                        placeholder="Explain why this service is being rejected..."
                        disabled={processing}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            disabled={processing}
                            className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleAction("rejected")}
                            disabled={!reason.trim() || processing}
                            className="px-3 py-1 text-sm bg-danger text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                            Confirm Rejection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
