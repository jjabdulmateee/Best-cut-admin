"use client";

import { useState, useEffect } from "react";
import { configService } from "@/lib/services/configService";
import { ConfigVersion } from "@/lib/types/configVersion";
import { ConfigVersionTimeline } from "@/components/Config/ConfigVersionTimeline";
import { RollbackConfirmationModal } from "@/components/Config/RollbackConfirmationModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { ArrowLeft, RotateCcw, Filter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConfigHistoryPage() {
    const router = useRouter();
    const [versions, setVersions] = useState<ConfigVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(20);

    // Rollback State
    const [rollbackTarget, setRollbackTarget] = useState<ConfigVersion | null>(null);
    const [isRollingBack, setIsRollingBack] = useState(false);

    useEffect(() => {
        const unsubscribe = configService.subscribeToVersionHistory((data) => {
            setVersions(data);
            setLoading(false);
        }, limit);

        return () => unsubscribe();
    }, [limit]);

    const handleRollbackConfirm = async (reason: string) => {
        if (!rollbackTarget) return;

        setIsRollingBack(true);
        try {
            await configService.rollbackConfig(rollbackTarget.versionId, reason);
            toast.success(`Successfully rolled back to ${rollbackTarget.versionId}`);
            setRollbackTarget(null);
            router.refresh();
        } catch (error: any) {
            console.error("Rollback failed:", error);
            toast.error(error.message || "Rollback failed");
        } finally {
            setIsRollingBack(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/dashboard/config"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Control Center
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight">Version History</h1>
                    <p className="text-muted-foreground">Immutable audit trail of all platform configuration changes.</p>
                </div>
            </div>

            {/* Filter / Info Bar */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <Filter size={14} />
                    Showing last {versions.length} versions
                </div>

                {versions.length >= limit && (
                    <button
                        onClick={() => setLimit(prev => prev + 20)}
                        className="text-xs font-bold text-brand-500 hover:underline"
                    >
                        Load More
                    </button>
                )}
            </div>

            {/* Timeline */}
            <ConfigVersionTimeline
                versions={versions}
                activeVersionId={versions[0]?.versionId}
                onRollbackClick={setRollbackTarget}
            />

            {/* Rollback Modal */}
            <RollbackConfirmationModal
                isOpen={!!rollbackTarget}
                onClose={() => setRollbackTarget(null)}
                onConfirm={handleRollbackConfirm}
                targetVersion={rollbackTarget}
                isProcessing={isRollingBack}
            />
        </div>
    );
}
