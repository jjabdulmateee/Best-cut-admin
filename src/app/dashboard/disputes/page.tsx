"use client";

import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot, orderBy, doc, getDoc, where } from "firebase/firestore";
import { Dispute } from "@/lib/types/dispute";
import {
    Scale,
    AlertCircle,
    Clock,
    ChevronRight,
    ShieldAlert,
    CheckCircle2,
    DollarSign,
    ExternalLink,
    LifeBuoy,
    User,
    Lock
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { securityService } from '@/lib/services/securityService';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { auth } from '@/lib/firebase/config';
import { useAdminMode } from '@/context/AdminModeContext';

export default function DisputesPage() {
    const { mode } = useAdminMode();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

    // Resolution Form State
    const [refundAmount, setRefundAmount] = useState("");
    const [barberPayout, setBarberPayout] = useState("");
    const [resolutionNote, setResolutionNote] = useState("");

    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    // Safety Confirmation Modal State
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        setLoading(true);
        // Customer Mode -> Support Tickets
        // Barber Mode -> Partner Disputes
        const targetReporter = mode === 'customer' ? 'customer' : 'barber';

        const q = query(
            collection(db, "disputes"),
            where("reporterType", "==", targetReporter),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            setDisputes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Dispute)));
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Disputes subscription error:", err);
            setError(err.message);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [mode]);

    // Reset form when selection changes
    useEffect(() => {
        if (selectedDispute) {
            setRefundAmount("");
            setBarberPayout("");
            setResolutionNote("");
            setShowConfirmation(false);
        }
    }, [selectedDispute]);

    const handleResolveClick = () => {
        if (!selectedDispute || !resolutionNote) {
            toast.error("Resolution note is required");
            return;
        }
        setShowConfirmation(true);
    };

    const executeResolution = async () => {
        if (!selectedDispute) return;

        setProcessing(true);
        try {
            await securityService.resolveDispute({
                disputeId: selectedDispute.id,
                resolution: resolutionNote,
                refundAmount: parseFloat(refundAmount) || 0,
                barberPayout: parseFloat(barberPayout) || 0
            });
            toast.success("Case resolved successfully. Funds distributed.");
            setShowConfirmation(false);
            // Optionally clear selection or keep it to show updated status (Snapshot will update it)
        } catch (error) {
            console.error(error);
            toast.error("Failed to execute resolution. Check console.");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusStyle = (status: Dispute['status']) => {
        switch (status) {
            case 'open': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'under_review': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const isCustomerMode = mode === 'customer';

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 min-h-screen">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className={`p-2 rounded-lg text-white ${isCustomerMode ? 'bg-indigo-600' : 'bg-red-600'}`}>
                            {isCustomerMode ? <LifeBuoy size={20} /> : <Scale size={20} />}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {isCustomerMode ? 'Customer Support Tickets' : 'Partner Dispute Resolution'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center bg-card border border-border p-1 rounded-xl">
                        <Link href="/dashboard" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Overview</Link>
                        {!isCustomerMode && <Link href="/dashboard/fleet" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Fleet</Link>}
                        <Link href="/dashboard/map" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Map HQ</Link>
                        <Link href="/dashboard/ops" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Ops Center</Link>
                        <Link href="/dashboard/trust" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Trust HQ</Link>
                        <Link href="/dashboard/disputes" className={`px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors text-foreground bg-muted rounded-lg shadow-sm`}>Litigation</Link>
                        <Link href="/dashboard/analytics" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
                    </nav>
                    <ThemeToggle />
                </div>
            </div>

            {error ? (
                <div className="text-center p-12 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-red-500 mb-2">Access Denied</h3>
                    <p className="text-muted-foreground mb-4">You do not have permission to view litigation records.</p>
                    <div className="font-mono text-xs text-muted-foreground">Admin Signature: {auth.currentUser?.uid}</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: DISPUTE LIST (Simplified Admin View) */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Docket</h3>
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-mono">{disputes.length} CASES</span>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center opacity-30">
                                <Clock className="mx-auto mb-2 animate-spin" size={24} />
                            </div>
                        ) : disputes.length === 0 ? (
                            <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border opacity-50">
                                <CheckCircle2 className="mx-auto mb-2 text-success" size={24} />
                                <p className="text-xs font-bold uppercase tracking-widest">No Active Disputes</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                                {disputes.map(dispute => {
                                    const isActive = selectedDispute?.id === dispute.id;
                                    return (
                                        <button
                                            key={dispute.id}
                                            onClick={async () => {
                                                setSelectedDispute(dispute);
                                                // Lazy fetch booking details on selection
                                                const bookingRef = doc(db, "bookings", dispute.bookingId);
                                                const bookingSnap = await getDoc(bookingRef);
                                                setSelectedBooking(bookingSnap.exists() ? bookingSnap.data() : null);
                                            }}
                                            className={`w-full text-left p-4 rounded-xl border transition-all group ${isActive
                                                    ? 'bg-brand-500/10 border-brand-500 shadow-md relative overflow-hidden'
                                                    : 'bg-card border-border hover:border-brand-500/50 hover:bg-muted/30'
                                                }`}
                                        >
                                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500" />}

                                            {/* Row 1: Who vs Complainant and Status */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-md ${dispute.reporterType === 'customer' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                        <User size={12} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground capitalize">
                                                            {dispute.reporterType}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">
                                                            Complaint Filed
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getStatusStyle(dispute.status)}`}>
                                                    {dispute.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Row 2: Booking ID & Date */}
                                            <div className="flex items-center justify-between mt-3 pl-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                                                    <span className="opacity-50">ID:</span>
                                                    <span className="text-foreground tracking-wider font-bold">#{dispute.bookingId.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {format(dispute.createdAt.toDate(), 'MMM d')}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: DETAIL VIEW & ACTION FLOW */}
                    <div className="lg:col-span-8">
                        {selectedDispute ? (
                            <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">

                                {/* 1. CONTEXT HEADER */}
                                <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldAlert className="text-danger" size={20} />
                                            <h2 className="text-xl font-bold tracking-tight text-foreground">Dispute Resolution</h2>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span>Case ID: <span className="font-mono text-foreground">{selectedDispute.id}</span></span>
                                            <span>•</span>
                                            <span>Created {formatDistanceToNow(selectedDispute.createdAt.toDate())} ago</span>
                                        </div>
                                    </div>
                                    <Link href={`/dashboard`} className="p-2 border border-border rounded-lg hover:bg-background transition-colors" title="View Full Booking Details">
                                        <ExternalLink size={16} />
                                    </Link>
                                </div>

                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* 2. EVIDENCE SECTION */}
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                                <AlertCircle size={14} /> The Complaint
                                            </h4>
                                            <div className="bg-muted/30 p-5 rounded-xl border border-border">
                                                <p className="font-bold text-foreground text-sm mb-2">{selectedDispute.reason}</p>
                                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                    "{selectedDispute.details}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-background border border-border p-4 rounded-xl flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking Total</p>
                                                <p className="text-lg font-mono font-bold text-foreground">
                                                    ${selectedBooking?.totalPrice?.toLocaleString() || "..."}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${selectedDispute.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {selectedDispute.status === 'resolved' ? 'FUNDS SETTLED' : 'FUNDS LOCKED'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. RESOLUTION / ACTION FLOW */}
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                            <Scale size={14} />
                                            {selectedDispute.status === 'resolved' ? 'Settlement Record' : 'Admin Action'}
                                        </h4>

                                        {selectedDispute.status === 'resolved' ? (
                                            // READ ONLY VIEW FOR RESOLVED CASES
                                            <div className="space-y-4 opacity-75">
                                                <div className="bg-green-500/5 border border-green-500/20 p-5 rounded-xl space-y-4">
                                                    <div className="flex items-center gap-2 text-green-500 mb-2">
                                                        <CheckCircle2 size={18} />
                                                        <span className="font-bold text-sm uppercase">Case Closed</span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="block text-[10px] uppercase text-muted-foreground font-bold">Refunded to Customer</span>
                                                            <span className="font-mono font-bold text-foreground">${selectedDispute.refundAmount || 0}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-[10px] uppercase text-muted-foreground font-bold">Paid to Barber</span>
                                                            <span className="font-mono font-bold text-foreground">${selectedDispute.barberPayout || 0}</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-green-500/10">
                                                        <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1">Resolution Note</span>
                                                        <p className="text-sm italic text-foreground">"{selectedDispute.resolutionNote}"</p>
                                                    </div>

                                                    <div className="text-[10px] text-green-600/60 font-mono mt-2">
                                                        Closed by Admin {selectedDispute.resolvedBy} on {selectedDispute.resolvedAt ? format(selectedDispute.resolvedAt.toDate(), 'MMM d, yyyy HH:mm') : 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // EDITABLE ACTION FORM FOR OPEN CASES
                                            <div className="bg-brand-500/5 border border-brand-500/20 p-6 rounded-2xl space-y-5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold uppercase text-brand-300">Refund Customer ($)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={refundAmount}
                                                            onChange={e => setRefundAmount(e.target.value)}
                                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold uppercase text-brand-300">Payout Barber ($)</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={barberPayout}
                                                            onChange={e => setBarberPayout(e.target.value)}
                                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase text-brand-300">Resolution Note</label>
                                                    <textarea
                                                        value={resolutionNote}
                                                        onChange={e => setResolutionNote(e.target.value)}
                                                        className="w-full h-24 bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none placeholder:text-muted-foreground/50"
                                                        placeholder="Explain your decision. This note will be visible in the final record except for admin-internal details..."
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleResolveClick}
                                                    className="w-full py-3 bg-brand-500 hover:bg-brand-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 active:translate-y-0.5"
                                                >
                                                    Review & Execute Settlement
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center opacity-30 select-none border-2 border-dashed border-border rounded-3xl">
                                <Scale size={48} className="mb-4 text-muted-foreground" />
                                <h2 className="text-xl font-bold uppercase tracking-widest text-foreground">Awaiting Selection</h2>
                                <p className="text-sm mt-2 max-w-xs mx-auto">Select an active dispute from the docket to review evidence and issue a ruling.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SAFETY CONFIRMATION MODAL */}
            {showConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-6">
                        <div className="flex items-center gap-3 text-brand-500 mb-2">
                            <ShieldAlert size={28} />
                            <h3 className="text-xl font-bold uppercase tracking-wide">Confirm Settlement</h3>
                        </div>

                        <div className="space-y-4 bg-muted/30 p-4 rounded-xl">
                            <p className="text-sm text-foreground">You are about to execute the following irrevocable actions:</p>
                            <ul className="space-y-2 text-sm font-mono text-muted-foreground">
                                <li className="flex justify-between">
                                    <span>Refund Customer:</span>
                                    <span className="font-bold text-foreground">${parseFloat(refundAmount || '0').toFixed(2)}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Payout Barber:</span>
                                    <span className="font-bold text-foreground">${parseFloat(barberPayout || '0').toFixed(2)}</span>
                                </li>
                                <li className="flex justify-between pt-2 border-t border-border mt-2">
                                    <span>Total Movement:</span>
                                    <span className="font-bold text-brand-500">${(parseFloat(refundAmount || '0') + parseFloat(barberPayout || '0')).toFixed(2)}</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 py-3 rounded-xl border border-border font-bold hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeResolution}
                                disabled={processing}
                                className="flex-1 py-3 rounded-xl bg-brand-500 text-black font-bold hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
                            >
                                {processing ? 'Executing...' : 'CONFIRM EXECUTION'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
