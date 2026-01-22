"use client";

import React, { useEffect, useState } from 'react';
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot, orderBy, doc, getDoc, where } from "firebase/firestore";
import { Dispute } from "@/lib/types/dispute";
import {
    Scale,
    AlertCircle,
    Clock,
    Users,
    ChevronRight,
    ShieldAlert,
    CheckCircle2,
    DollarSign,
    ExternalLink,
    LifeBuoy
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { securityService } from '@/lib/services/securityService';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { auth } from '@/lib/firebase/config';
import { Cpu } from 'lucide-react';
import { useAdminMode } from '@/context/AdminModeContext';

export default function DisputesPage() {
    const { mode } = useAdminMode();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [refundAmount, setRefundAmount] = useState("");
    const [barberPayout, setBarberPayout] = useState("");
    const [resolutionNote, setResolutionNote] = useState("");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    useEffect(() => {
        setLoading(true);
        // Filter disputes based on active mode
        // Customer Mode -> Shows tickets created by Customers (Support Tickets)
        // Barber Mode -> Shows tickets created by Barbers (Partner Disputes)
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
            // Fallback for missing index if necessary, but ideally we show error
            setError(err.message);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [mode]);

    const handleResolve = async () => {
        if (!selectedDispute || !resolutionNote) {
            toast.error("Resolution note is required");
            return;
        }
        setProcessing(true);
        try {
            await securityService.resolveDispute({
                disputeId: selectedDispute.id,
                resolution: resolutionNote,
                refundAmount: parseFloat(refundAmount) || 0,
                barberPayout: parseFloat(barberPayout) || 0
            });
            toast.success("Case resolved and funds distributed");
            setSelectedDispute(null);
            setResolutionNote("");
            setRefundAmount("");
            setBarberPayout("");
        } catch (error) {
            toast.error("Failed to resolve case");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusStyle = (status: Dispute['status']) => {
        switch (status) {
            case 'open': return 'bg-danger/10 text-danger border-danger/20';
            case 'under_review': return 'bg-warning/10 text-warning border-warning/20';
            case 'resolved': return 'bg-success/10 text-success border-success/20';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    const isCustomerMode = mode === 'customer';
    const mainColor = isCustomerMode ? 'text-indigo-500' : 'text-danger';
    const bgColor = isCustomerMode ? 'bg-indigo-500' : 'bg-danger';
    const borderColor = isCustomerMode ? 'border-indigo-500' : 'border-danger';

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
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
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${isCustomerMode ? 'bg-indigo-400' : 'bg-red-500'}`} />
                        {isCustomerMode ? 'Help Desk & Refund Requests' : 'Official Platform Arbitration'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <nav className="flex items-center bg-card border border-border p-1 rounded-xl">
                        <Link href="/dashboard" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Overview</Link>
                        {!isCustomerMode && <Link href="/dashboard/fleet" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Fleet</Link>}
                        <Link href="/dashboard/map" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Map HQ</Link>
                        <Link href="/dashboard/ops" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Ops Center</Link>
                        <Link href="/dashboard/trust" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Trust HQ</Link>
                        <Link href="/dashboard/disputes" className={`px-4 py-2 text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors ${isCustomerMode ? 'text-foreground bg-muted rounded-lg shadow-sm' : 'text-foreground bg-muted rounded-lg shadow-sm'}`}>Litigation</Link>
                        <Link href="/dashboard/analytics" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Analytics</Link>
                    </nav>
                    <ThemeToggle />
                </div>
            </div>

            {error ? (
                <div className="rounded-3xl border border-border bg-card p-12 space-y-8 shadow-2xl relative overflow-hidden group max-w-5xl mx-auto text-center">
                    <div className="absolute -top-12 -right-12 p-32 bg-danger/5 rounded-full blur-3xl group-hover:bg-danger/10 transition-colors" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="p-4 bg-danger/20 rounded-2xl text-danger border border-danger/20">
                            <Scale size={32} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-widest text-foreground">Litigation Engine Locked</h3>
                            <p className="text-muted-foreground text-sm uppercase tracking-wider font-bold opacity-50">Authorized Personnel Only</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 text-left">
                        <div className="space-y-6">
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                The platform arbitration layer handles sensitive escrow movements. Access is restricted to accounts with a verified <span className="text-foreground font-bold">\"Admin\"</span> signature in the system core.
                            </p>
                            <div className="bg-background/50 p-6 rounded-2xl border border-border font-mono text-xs break-all shadow-inner group">
                                <span className="text-muted-foreground block mb-2 uppercase tracking-widest font-bold text-[9px]">Identity Signature:</span>
                                <span className="text-success select-all text-xs font-bold">{auth.currentUser?.uid || "SIGNATURE_MISSING"}</span>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-8 rounded-2xl border border-border space-y-4">
                            <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-4 decoration-danger underline">Authorization Protocol</p>
                            {[
                                "Open Firebase Console",
                                "Target Collection: 'admins'",
                                "Create Document ID: [Signature Left]",
                                "Append Field: 'email' = (Your Email)"
                            ].map((step, idx) => (
                                <div key={idx} className="flex items-center gap-4 text-xs font-bold text-foreground">
                                    <span className="w-6 h-6 flex items-center justify-center rounded bg-danger/20 text-danger text-[10px]">{idx + 1}</span>
                                    {step}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Dispute List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2">Active Cases</h3>
                        {loading ? (
                            <div className="p-12 text-center opacity-30">
                                <Clock className="mx-auto mb-2 animate-spin" size={24} />
                            </div>
                        ) : disputes.length === 0 ? (
                            <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-border opacity-50">
                                <CheckCircle2 className="mx-auto mb-2 text-success" size={24} />
                                <p className="text-xs font-bold uppercase tracking-widest">Docket Clear</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {disputes.map(dispute => (
                                    <button
                                        key={dispute.id}
                                        onClick={async () => {
                                            setSelectedDispute(dispute);
                                            // Fetch booking details
                                            const bookingRef = doc(db, "bookings", dispute.bookingId);
                                            const bookingSnap = await getDoc(bookingRef);
                                            if (bookingSnap.exists()) {
                                                setSelectedBooking(bookingSnap.data());
                                            } else {
                                                setSelectedBooking(null);
                                            }
                                        }}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedDispute?.id === dispute.id
                                            ? 'bg-brand-500/10 border-brand-500 shadow-lg shadow-brand-500/5'
                                            : 'bg-card border-border hover:border-brand-500/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border ${getStatusStyle(dispute.status)}`}>
                                                {dispute.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(dispute.createdAt.toDate())} ago
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-bold mb-1 line-clamp-1">{dispute.reason}</h4>
                                        <p className="text-[10px] text-muted-foreground line-clamp-2">{dispute.details}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                                                <AlertCircle size={10} />
                                                #{dispute.bookingId.slice(-6).toUpperCase()}
                                            </div>
                                            <ChevronRight size={14} className="text-muted-foreground" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Case Detail & Action */}
                    <div className="lg:col-span-2">
                        {selectedDispute ? (
                            <div className="bg-card border border-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Header */}
                                <div className="p-6 border-b border-border bg-muted/30">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-danger">
                                                <ShieldAlert size={18} />
                                                <h2 className="text-lg font-bold">Case Review: {selectedDispute.id}</h2>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Official Platform Litigation</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 border border-border rounded-lg bg-background hover:bg-muted transition-colors" title="View Trip">
                                                <ExternalLink size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Evidence */}
                                <div className="p-6 space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-border bg-background">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Reporter</p>
                                            <p className="text-sm font-bold">{selectedDispute.reporterType.toUpperCase()}</p>
                                            <p className="text-[10px] font-mono opacity-50">{selectedDispute.reporterId}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-border bg-background">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Target</p>
                                            <p className="text-sm font-bold">{selectedDispute.reporterType === 'customer' ? 'BARBER' : 'CUSTOMER'}</p>
                                            <p className="text-[10px] font-mono opacity-50">{selectedDispute.targetId}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Statement of Claim</h4>
                                        <div className="p-4 rounded-xl border border-border bg-muted/20 text-sm leading-relaxed whitespace-pre-wrap">
                                            {selectedDispute.details}
                                        </div>
                                    </div>

                                    {/* Financial Snapshot */}
                                    <div className="p-6 rounded-2xl border border-brand-500/20 bg-brand-500/5 space-y-4">
                                        <div className="flex items-center gap-2 text-brand-400">
                                            <DollarSign size={18} />
                                            <h4 className="text-sm font-bold uppercase">Escrow Status</h4>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Original Trip Value</span>
                                            <span className="text-lg font-mono font-bold">
                                                ${selectedBooking?.totalPrice?.toLocaleString() || "—"}
                                            </span>
                                        </div>
                                        <div className="h-px bg-border" />
                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Propose Resolution</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase ml-1">Refund Customer</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={refundAmount}
                                                        onChange={(e) => setRefundAmount(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-brand-500 outline-none transition-colors"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold uppercase ml-1">Payout Barber</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={barberPayout}
                                                        onChange={(e) => setBarberPayout(e.target.value)}
                                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-brand-500 outline-none transition-colors"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <textarea
                                                value={resolutionNote}
                                                onChange={(e) => setResolutionNote(e.target.value)}
                                                className="w-full h-24 bg-background border border-border rounded-xl p-3 text-sm focus:border-brand-500 outline-none transition-colors resize-none"
                                                placeholder="Resolution justification... (Mandatory for Audit)"
                                            ></textarea>
                                            <button
                                                onClick={handleResolve}
                                                disabled={processing}
                                                className="w-full py-3 bg-brand-500 text-black font-bold rounded-xl hover:bg-brand-400 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {processing ? "Executing..." : "EXECUTE SETTLEMENT"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[600px] flex flex-col items-center justify-center text-center opacity-20 select-none">
                                <Scale size={64} className="mb-4" />
                                <h2 className="text-2xl font-bold uppercase tracking-widest">Awaiting Case Selection</h2>
                                <p className="max-w-xs mt-2 text-xs font-bold uppercase tracking-wider">Select a dispute from the deck to begin official arbitration.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
