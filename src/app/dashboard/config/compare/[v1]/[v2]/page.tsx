"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { configService } from "@/lib/services/configService";
import { ConfigVersion, FieldDiff } from "@/lib/types/configVersion";
import { ConfigDiffViewer } from "@/components/Config/ConfigDiffViewer";
import { RollbackConfirmationModal } from "@/components/Config/RollbackConfirmationModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "react-hot-toast";
import { ArrowLeft, RotateCcw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

export default function ConfigComparePage() {
    const params = useParams();
    const router = useRouter();
    const { v1, v2 } = params;

    const [loading, setLoading] = useState(true);
    const [diffData, setDiffData] = useState<{
        diff: FieldDiff[];
        versionA: ConfigVersion;
        versionB: ConfigVersion;
    } | null>(null);

    // Rollback State
    const [rollbackTarget, setRollbackTarget] = useState<ConfigVersion | null>(null);
    const [isRollingBack, setIsRollingBack] = useState(false);

    useEffect(() => {
        async function loadDiff() {
            if (!v1 || !v2) return;
            try {
                const data = await configService.getConfigDiff(v1 as string, v2 as string);
                setDiffData(data);
            } catch (error) {
                console.error("Failed to load diff:", error);
                toast.error("Failed to load version comparison");
            } finally {
                setLoading(false);
            }
        }

        loadDiff();
    }, [v1, v2]);

    const handleRollbackConfirm = async (reason: string) => {
        if (!rollbackTarget) return;

        setIsRollingBack(true);
        try {
            await configService.rollbackConfig(rollbackTarget.versionId, reason);
            toast.success(`Successfully rolled back to ${rollbackTarget.versionId}`);
            setRollbackTarget(null);
            router.push("/dashboard/config");
        } catch (error: any) {
            console.error("Rollback failed:", error);
            toast.error(error.message || "Rollback failed");
        } finally {
            setIsRollingBack(false);
        }
    };

    const formatDate = (timestamp?: Timestamp) => {
        if (!timestamp?.seconds) return 'N/A';
        return format(new Date(timestamp.seconds * 1000), "MMM d, yyyy • HH:mm:ss");
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!diffData) {
        return (
            <div className="p-8 text-center text-danger">
                Version data not found.
            </div>
        );
    }

    const { versionA, versionB, diff } = diffData;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div>
                    <Link
                        href="/dashboard/config/history"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                    >
                        <ArrowLeft size={16} />
                        Back to History
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight">Compare Versions</h1>
                </div>

                {/* Version Headers */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl bg-muted/20 border border-danger/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-danger/50" />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-danger">Reference Version</span>
                                <button
                                    onClick={() => setRollbackTarget(versionA)}
                                    className="text-[10px] font-bold uppercase bg-background border border-border px-2 py-1 rounded hover:bg-danger hover:text-white hover:border-danger transition-colors cursor-pointer"
                                >
                                    Restore this
                                </button>
                            </div>
                            <div className="text-2xl font-bold font-mono">{versionA.versionId}</div>
                            <div className="text-xs text-muted-foreground">
                                {formatDate(versionA.createdAt)}
                            </div>
                            <div className="pt-2 border-t border-border/10">
                                <p className="text-sm italic text-foreground/80">"{versionA.changeReason}"</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-muted/20 border border-emerald-500/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Comparison Version</span>
                                <button
                                    onClick={() => setRollbackTarget(versionB)}
                                    className="text-[10px] font-bold uppercase bg-background border border-border px-2 py-1 rounded hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors cursor-pointer"
                                >
                                    Restore this
                                </button>
                            </div>
                            <div className="text-2xl font-bold font-mono">{versionB.versionId}</div>
                            <div className="text-xs text-muted-foreground">
                                {formatDate(versionB.createdAt)}
                            </div>
                            <div className="pt-2 border-t border-border/10">
                                <p className="text-sm italic text-foreground/80">"{versionB.changeReason}"</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diff Viewer */}
            <ConfigDiffViewer
                diff={diff}
                versionA={versionA}
                versionB={versionB}
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
