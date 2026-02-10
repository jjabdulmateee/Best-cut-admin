"use client";

import { ConfigVersion } from "@/lib/types/configVersion";
import { format } from "date-fns";
import { History, GitCommit, CornerDownRight, Eye, ArrowLeftRight, RotateCcw } from "lucide-react";
import Link from "next/link";

interface ConfigVersionTimelineProps {
    versions: ConfigVersion[];
    onRollbackClick: (version: ConfigVersion) => void;
    activeVersionId?: string;
}

export function ConfigVersionTimeline({ versions, onRollbackClick, activeVersionId }: ConfigVersionTimelineProps) {
    if (versions.length === 0) {
        return (
            <div className="p-12 text-center border border-dashed border-border rounded-xl">
                <History className="mx-auto text-muted-foreground/50 mb-4" size={32} />
                <p className="text-muted-foreground text-sm">No version history available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative ml-4 md:ml-0">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-border/50 hidden md:block" />

            {versions.map((version, idx) => {
                const isActive = version.versionId === activeVersionId;
                const previousVersion = versions[idx + 1];

                return (
                    <div
                        key={version.versionId}
                        className={`relative pl-0 md:pl-16 transition-all ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                    >
                        {/* Timeline Node */}
                        <div className={`absolute left-[21px] top-6 w-3 h-3 rounded-full border-2 z-10 hidden md:block ${isActive ? 'bg-brand-500 border-brand-500' :
                                version.isRollback ? 'bg-orange-500 border-orange-500' :
                                    'bg-background border-muted-foreground'
                            }`} />

                        <div className={`
              rounded-2xl border p-5 transition-all
              ${isActive
                                ? 'bg-brand-500/5 border-brand-500/30 shadow-lg shadow-brand-500/5'
                                : version.isRollback
                                    ? 'bg-orange-500/5 border-orange-500/20'
                                    : 'bg-card border-border hover:border-border/80'
                            }
            `}>
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`
                    text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded
                    ${isActive ? 'bg-brand-500 text-white' : 'bg-muted text-foreground'}
                  `}>
                                        {version.versionId}
                                    </span>

                                    {version.isRollback && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                                            <RotateCcw size={10} />
                                            Rollback
                                        </span>
                                    )}

                                    <span className="text-xs text-muted-foreground">
                                        by <span className="text-foreground font-medium">{version.createdByAdminEmail?.split('@')[0] || 'Unknown'}</span>
                                    </span>
                                </div>

                                <div className="text-xs text-muted-foreground font-mono">
                                    {version.createdAt?.seconds
                                        ? format(new Date(version.createdAt.seconds * 1000), "MMM d, yyyy • HH:mm:ss")
                                        : "Unknown Date"}
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="mb-6">
                                <p className="text-sm italic text-foreground/80 border-l-2 border-brand-500/20 pl-3 py-1">
                                    "{version.changeReason}"
                                </p>
                                {version.isRollback && version.rollbackFromVersionId && (
                                    <p className="mt-2 text-xs flex items-center gap-1 text-orange-500/80">
                                        <CornerDownRight size={12} />
                                        Restored content from standard {version.rollbackFromVersionId}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2">
                                {!isActive && (
                                    <button
                                        onClick={() => onRollbackClick(version)}
                                        className="px-3 py-1.5 rounded-lg border border-border hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-600 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                    >
                                        <RotateCcw size={12} />
                                        Rollback to this
                                    </button>
                                )}

                                {previousVersion && (
                                    <Link
                                        href={`/dashboard/config/compare/${previousVersion.versionId}/${version.versionId}`}
                                        className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                    >
                                        <ArrowLeftRight size={12} />
                                        Compare with Prev
                                    </Link>
                                )}

                                {/* Fallback compare if no previous (for latest or arbitrary) */}

                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
