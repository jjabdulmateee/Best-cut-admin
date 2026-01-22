"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { customerService } from "@/lib/services/customerService";
import { Customer } from "@/lib/types/customer";
import {
    ArrowLeft, Ban, AlertTriangle,
    ShieldAlert, Clock, CheckCircle, Mail, Phone, Calendar,
    MoreVertical, FileWarning, StopCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Props {
    id: string;
}

export function CustomerProfile({ id }: Props) {
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"bookings" | "logs">("bookings");

    // Governance Modal State
    const [actionModal, setActionModal] = useState<{
        open: boolean;
        type: 'warn' | 'suspend' | 'ban' | null;
    }>({ open: false, type: null });
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadCustomer();
    }, [id]);

    const loadCustomer = async () => {
        try {
            const data = await customerService.getCustomer(id);
            setCustomer(data);
        } catch (e) {
            toast.error("Failed to load customer");
        } finally {
            setLoading(false);
        }
    };

    const executeAction = async () => {
        if (!customer || !actionModal.type) return;
        setProcessing(true);
        try {
            if (actionModal.type === 'ban') {
                await customerService.updateStatus(customer.uid, 'banned', reason);
                toast.success("Customer Banned Successfully");
            } else if (actionModal.type === 'suspend') {
                await customerService.updateStatus(customer.uid, 'suspended', reason);
                toast.success("Customer Suspended");
            } else if (actionModal.type === 'warn') {
                // Just log warning for now, backend would send email
                await customerService.updateStatus(customer.uid, customer.status, reason, { "metadata.notes": `WARN: ${reason}` });
                toast.success("Warning Logged");
            }
            await loadCustomer();
            setActionModal({ open: false, type: null });
            setReason("");
        } catch (e) {
            toast.error("Action Failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-24 flex justify-center"><LoadingSpinner /></div>;
    if (!customer) return <div className="p-12 text-center text-muted-foreground">Customer Not Found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-muted transition-colors">
                    <ArrowLeft size={20} />
                </button>

                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-black text-2xl ring-4 ring-background shadow-lg">
                                {customer.displayName?.charAt(0) || "?"}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black">{customer.displayName || "Unknown User"}</h1>
                                <p className="font-mono text-muted-foreground flex items-center gap-2 text-sm">
                                    {customer.uid}
                                    <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                                    Joined {customer.createdAt?.toDate ? new Date(customer.createdAt.toDate()).toLocaleDateString() : "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 border ${customer.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                customer.status === 'banned' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    'bg-orange-500/10 text-orange-500 border-orange-500/20'
                            }`}>
                            {customer.status === 'active' && <CheckCircle size={14} />}
                            {customer.status === 'banned' && <Ban size={14} />}
                            {customer.status === 'suspended' && <Clock size={14} />}
                            {customer.status}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Contact & Actions */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Contact Data</h3>
                        <div className="flex items-center gap-3 text-sm">
                            <Mail size={16} className="text-muted-foreground" />
                            <span className="font-mono">{customer.email || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone size={16} className="text-muted-foreground" />
                            <span className="font-mono">{customer.phoneNumber || "N/A"}</span>
                        </div>
                    </div>

                    {/* Governance Actions (Only visible if not banned) */}
                    <div className="bg-card border border-border rounded-3xl p-6 space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Governance Actions</h3>

                        <button
                            onClick={() => setActionModal({ open: true, type: 'warn' })}
                            className="w-full p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-500 font-bold text-xs uppercase hover:bg-yellow-500/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <AlertTriangle size={14} /> Send Official Warning
                        </button>

                        <button
                            onClick={() => setActionModal({ open: true, type: 'suspend' })}
                            className="w-full p-3 rounded-xl border border-orange-500/30 bg-orange-500/5 text-orange-500 font-bold text-xs uppercase hover:bg-orange-500/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <Clock size={14} /> Suspend Account (7 Days)
                        </button>

                        <button
                            onClick={() => setActionModal({ open: true, type: 'ban' })}
                            className="w-full p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 font-bold text-xs uppercase hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                        >
                            <Ban size={14} /> Permanently Ban
                        </button>
                    </div>
                </div>

                {/* Right Column: Stats & Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Risk Panel */}
                    <div className="bg-card border border-border rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Trust Profile</h3>
                            <span className="text-2xl font-black text-foreground">{customer.riskScore || 0}<span className="text-sm text-muted-foreground">/100</span></span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${customer.riskScore > 70 ? 'bg-red-500' : customer.riskScore > 30 ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${customer.riskScore}%` }}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-card border border-border rounded-3xl min-h-[400px]">
                        <div className="flex items-center border-b border-border">
                            <button
                                onClick={() => setActiveTab('bookings')}
                                className={`px-8 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'bookings' ? 'border-pink-500 text-pink-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                Booking History
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`px-8 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'logs' ? 'border-pink-500 text-pink-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                Admin Logs
                            </button>
                        </div>

                        <div className="p-8 text-center text-muted-foreground text-sm">
                            {activeTab === 'bookings' && (
                                <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                    <Calendar size={32} />
                                    <p>No bookings found for this customer.</p>
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                    <ShieldAlert size={32} />
                                    <p>No administrative actions recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {actionModal.open && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
                        <div className="flex items-center gap-4 text-foreground">
                            {actionModal.type === 'ban' && <Ban size={32} className="text-red-500" />}
                            {actionModal.type === 'suspend' && <Clock size={32} className="text-orange-500" />}
                            {actionModal.type === 'warn' && <AlertTriangle size={32} className="text-yellow-500" />}
                            <div>
                                <h2 className="text-xl font-bold uppercase">Confirm {actionModal.type}</h2>
                                <p className="text-xs text-muted-foreground">This action will be logged and notified.</p>
                            </div>
                        </div>

                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for this action (Required)..."
                            className="w-full h-32 bg-muted/50 border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-brand-500 resize-none"
                        />

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setActionModal({ open: false, type: null })}
                                className="flex-1 py-3 rounded-xl font-bold bg-muted hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={!reason.trim() || processing}
                                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${!reason.trim() ? 'opacity-50 cursor-not-allowed bg-muted' :
                                        actionModal.type === 'ban' ? 'bg-red-500 hover:bg-red-600' :
                                            actionModal.type === 'suspend' ? 'bg-orange-500 hover:bg-orange-600' :
                                                'bg-yellow-500 hover:bg-yellow-600'
                                    }`}
                            >
                                {processing ? "Processing..." : "Confirm Action"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
