"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    CheckCircle,
    Clock,
    AlertTriangle,
    Eye,
    X,
    User,
    Scissors,
    Navigation,
    MoreHorizontal
} from 'lucide-react';
import { opsService } from '@/lib/services/opsService';
import { financeService } from '@/lib/services/financeService';
import { Booking } from '@/lib/types/booking';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { BookingTimeline } from './BookingTimeline';
import toast from 'react-hot-toast';

export const BookingMonitor = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const { user: admin } = useAuth();

    useEffect(() => {
        let isMounted = true;

        const unsubscribe = opsService.subscribeToRecentBookings((data) => {
            if (!isMounted) return;
            setBookings(data);
            setLoading(false);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const handleForceAction = async (bookingId: string, action: 'cancel' | 'complete', reason: string) => {
        if (!admin) return;
        try {
            await opsService.forceAction(bookingId, admin.uid, action, reason);
            toast.success(`Booking ${action}ed successfully`);
            setSelectedBooking(null);
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleRefund = async () => {
        if (!selectedBooking) return;
        const amountStr = prompt(`Refund Amount (Total Price: $${selectedBooking.totalPrice || 0}):`, (selectedBooking.totalPrice || 0).toString());
        if (!amountStr) return;

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Invalid amount");
            return;
        }

        const reason = prompt("Refund Reason:");
        if (!reason) return;

        try {
            await financeService.issueRefund({
                bookingId: selectedBooking.uid,
                amount,
                reason,
                targetUserId: selectedBooking.customerId
            });
            toast.success("Refund processed successfully");
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getStatusStyle = (status: Booking['status']) => {
        switch (status) {
            case 'requested': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'accepted': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'on_the_way': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'arrived': return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
            case 'completed': return 'bg-success/10 text-success border-success/20';
            case 'cancelled': return 'bg-danger/10 text-danger border-danger/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="p-12 text-center opacity-50">
                <Clock className="mx-auto mb-2 animate-spin" size={24} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Hydrating Live Stream...</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-muted/30 text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border">
                        <th className="px-6 py-4 font-bold">Booking ID / Time</th>
                        <th className="px-6 py-4 font-bold">Customer</th>
                        <th className="px-6 py-4 font-bold">Barber</th>
                        <th className="px-6 py-4 font-bold">Service</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    <AnimatePresence mode="popLayout">
                        {bookings.map((booking) => (
                            <motion.tr
                                key={booking.uid}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="group hover:bg-muted/20 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono text-muted-foreground">#{booking.uid.slice(-6).toUpperCase()}</span>
                                        <span className="text-xs font-medium text-foreground">
                                            {booking.createdAt?.toDate ? format(booking.createdAt.toDate(), 'HH:mm:ss') : "Live"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <User size={12} />
                                        </div>
                                        <span className="text-xs font-bold text-foreground">{booking.customerName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400">
                                            <Scissors size={12} />
                                        </div>
                                        <span className="text-xs font-bold text-foreground">{booking.barberName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Navigation size={12} className={booking.serviceType === 'doorstep' ? 'text-orange-400' : 'text-blue-400'} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {booking.serviceType}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${getStatusStyle(booking.status)}`}>
                                        {booking.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedBooking(booking)}
                                            className="p-1.5 text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all"
                                            title="View Timeline"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-card border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Booking Intelligence</h2>
                                    <p className="text-xs text-muted-foreground">Forensic Timeline & Admin Overrides</p>
                                </div>
                                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: Timeline */}
                                    <BookingTimeline booking={selectedBooking} />

                                    {/* Right: Controls */}
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Administrative Control</h3>

                                        <div className="bg-muted p-4 rounded-xl border border-border space-y-4">
                                            <div className="flex items-center gap-2 text-warning mb-2">
                                                <AlertTriangle size={16} />
                                                <span className="text-xs font-bold uppercase">Incident Management</span>
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                Forcing a terminal state will bypass the barber&apos;s app logic and notify both parties. Mandatory for service resolution.
                                            </p>

                                            <div className="flex flex-col gap-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        const r = prompt("Reason for force cancellation:");
                                                        if (r) handleForceAction(selectedBooking.uid, 'cancel', r);
                                                    }}
                                                    className="w-full py-2 bg-danger/10 text-danger border border-danger/20 rounded-lg text-xs font-bold hover:bg-danger/20 transition-colors"
                                                >
                                                    FORCE CANCEL BOOKING
                                                </button>
                                                <button
                                                    onClick={() => handleForceAction(selectedBooking.uid, 'complete', 'Manual completion by admin')}
                                                    className="w-full py-2 bg-success/10 text-success border border-success/20 rounded-lg text-xs font-bold hover:bg-success/20 transition-colors"
                                                >
                                                    FORCE COMPLETE
                                                </button>
                                                <button
                                                    onClick={handleRefund}
                                                    className="w-full py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-colors mt-2"
                                                >
                                                    ISSUE REFUND
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
