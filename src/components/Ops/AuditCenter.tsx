"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { format } from "date-fns";
import { Search, Filter, Shield, Calendar, User, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLog {
    id: string;
    adminId: string;
    action: string;
    targetId?: string;
    reason?: string;
    timestamp: any;
}

export const AuditCenter = () => {
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        let isMounted = true;

        const q = query(
            collection(db, "admin_logs"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q,
            (snap) => {
                if (!isMounted) return;
                setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminLog)));
                setLoading(false);
            },
            (error) => {
                console.error("Audit logs subscription error:", error);
                if (isMounted) {
                    setLoading(false);
                }
            }
        );

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.adminId.toLowerCase().includes(filter.toLowerCase()) ||
        log.targetId?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Shield size={18} className="text-brand-500" />
                        Admin Audit Center
                    </h3>
                    <p className="text-xs text-muted-foreground">Immutable history of all administrative actions</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                        type="text"
                        placeholder="Filter logs..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-500 transition-all"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/10 text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border">
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Admin</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Target</th>
                            <th className="px-6 py-3">Reason / Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        <AnimatePresence mode="popLayout">
                            {filteredLogs.map((log) => (
                                <motion.tr
                                    key={log.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-muted/10 transition-colors"
                                >
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar size={12} />
                                            {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM d, HH:mm') : 'Recent'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                                {log.adminId[0]?.toUpperCase()}
                                            </div>
                                            <span className="text-xs font-medium text-foreground">{log.adminId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase tracking-wider border border-brand-500/20">
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-[10px] text-muted-foreground">
                                        {log.targetId ? `#${log.targetId.slice(-6).toUpperCase()}` : '—'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-xs text-muted-foreground line-clamp-1 italic max-w-xs">
                                            {log.reason || 'No details provided'}
                                        </p>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {filteredLogs.length === 0 && (
                <div className="p-12 text-center opacity-30">
                    <Filter className="mx-auto mb-2" size={24} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No logs match your filter</p>
                </div>
            )}
        </div>
    );
};
