import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, X, ExternalLink } from 'lucide-react';
import { notificationService } from '@/lib/services/notificationService';
import { AdminNotification } from '@/lib/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export const NotificationCenter = () => {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        return notificationService.subscribeToNotifications(setNotifications);
    }, []);

    const handleResolve = async (id: string) => {
        if (!user) return;
        await notificationService.resolveNotification(id, user.uid);
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'border-danger bg-danger/5 text-danger';
            case 'WARNING': return 'border-warning bg-warning/5 text-warning';
            default: return 'border-brand-500 bg-brand-500/5 text-brand-400';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-card border border-border hover:border-brand-500 transition-colors"
            >
                <Bell size={20} className={notifications.length > 0 ? "text-brand-400 animate-pulse" : "text-muted-foreground"} />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-background">
                        {notifications.length}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Bell size={16} className="text-brand-400" />
                                    Security Alerts
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-2 space-y-2">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">System Healthy</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <motion.div
                                            key={notif.id}
                                            layout
                                            className={`p-3 rounded-xl border ${getSeverityStyles(notif.severity)} relative group`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1">
                                                    {notif.severity === 'INFO' ? <Info size={16} /> : <AlertTriangle size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold uppercase tracking-wider mb-1">{notif.type}</p>
                                                    <h4 className="text-sm font-semibold mb-1">{notif.title}</h4>
                                                    <p className="text-xs opacity-80 mb-2">{notif.message}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] opacity-60">
                                                            {formatDistanceToNow(notif.createdAt.toDate())} ago
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleResolve(notif.id)}
                                                                className="text-[10px] font-bold bg-white/10 hover:bg-white/20 py-1 px-2 rounded-md uppercase"
                                                            >
                                                                Resolve
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
