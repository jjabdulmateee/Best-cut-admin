"use client";

import { FieldDiff, ConfigVersion } from "@/lib/types/configVersion";
import { Check, X, ArrowRight, Minus } from "lucide-react";

interface ConfigDiffViewerProps {
    diff: FieldDiff[];
    versionA: ConfigVersion;
    versionB: ConfigVersion;
}

export function ConfigDiffViewer({ diff, versionA, versionB }: ConfigDiffViewerProps) {
    const formatValue = (val: any) => {
        if (typeof val === "boolean") return val ? <Check size={14} className="inline text-emerald-500" /> : <X size={14} className="inline text-danger" />;
        if (typeof val === "object") return JSON.stringify(val);
        return String(val);
    };

    return (
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
            <div className="grid grid-cols-3 bg-muted/50 border-b border-border p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <div className="pl-4">Field Name</div>
                <div className="border-l border-border pl-4 flex items-center gap-2 text-danger">
                    <Minus size={12} />
                    {versionA.versionId} (Old)
                </div>
                <div className="border-l border-border pl-4 flex items-center gap-2 text-emerald-500">
                    <ArrowRight size={12} />
                    {versionB.versionId} (New)
                </div>
            </div>

            <div className="divide-y divide-border">
                {diff.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 hover:bg-muted/20 transition-colors">
                        {/* Field Name */}
                        <div className="p-4 font-mono text-sm font-medium text-foreground flex items-center">
                            {item.field}
                            {item.changeType === 'added' && <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded uppercase font-bold">New</span>}
                            {item.changeType === 'removed' && <span className="ml-2 text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">Removed</span>}
                        </div>

                        {/* Old Value */}
                        <div className={`p-4 font-mono text-sm border-l border-border break-all ${item.changeType === 'modified' || item.changeType === 'removed' ? 'bg-red-500/5 text-red-700 dark:text-red-400' : 'opacity-50'}`}>
                            {item.oldValue !== undefined ? formatValue(item.oldValue) : <span className="text-muted-foreground italic">null</span>}
                        </div>

                        {/* New Value */}
                        <div className={`p-4 font-mono text-sm border-l border-border break-all ${item.changeType === 'modified' || item.changeType === 'added' ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400' : 'opacity-50'}`}>
                            {item.newValue !== undefined ? formatValue(item.newValue) : <span className="text-muted-foreground italic">null</span>}
                        </div>
                    </div>
                ))}

                {diff.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground text-sm font-medium">
                        No differences found between these versions.
                    </div>
                )}
            </div>
        </div>
    );
}
