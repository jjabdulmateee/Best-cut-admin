"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { customerService } from "@/lib/services/customerService";
import { Customer } from "@/lib/types/customer";
import { Search, Loader2, AlertCircle, Ban, User, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export function CustomerDirectory() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);

    // Initial Load
    useEffect(() => {
        loadInitial();
    }, []);

    const loadInitial = async () => {
        try {
            const data = await customerService.getAllCustomers();
            setCustomers(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return loadInitial();

        setSearching(true);
        try {
            const results = await customerService.searchCustomers(searchTerm);
            setCustomers(results);
            if (results.length === 0) toast("No customers found matching that email/phone");
        } catch (error) {
            toast.error("Search failed");
        } finally {
            setSearching(false);
        }
    };

    const getStatusBadge = (status: Customer['status']) => {
        switch (status) {
            case 'active': return <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] font-bold uppercase border border-green-500/20 flex items-center gap-1"><CheckCircle size={10} /> Active</span>;
            case 'suspended': return <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded text-[10px] font-bold uppercase border border-orange-500/20 flex items-center gap-1"><Clock size={10} /> Suspended</span>;
            case 'banned': return <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-500/20 flex items-center gap-1"><Ban size={10} /> Banned</span>;
            case 'flagged': return <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-[10px] font-bold uppercase border border-yellow-500/20 flex items-center gap-1"><AlertCircle size={10} /> Flagged</span>;
            default: return <span className="text-muted-foreground text-xs">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 rounded-xl text-pink-500">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Customer Directory</h2>
                            <p className="text-xs text-muted-foreground">Manage user base and risk</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search by exact Email or Phone..."
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-pink-500 transition-colors text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
            </div>

            {/* List */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-muted/30 border-b border-border">
                        <tr>
                            <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-6">Profile</th>
                            <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contact</th>
                            <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status</th>
                            <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Risk Score</th>
                            <th className="p-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right pr-6">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {loading || searching ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading Customers...</div>
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                    No customers found. Search to find specific users.
                                </td>
                            </tr>
                        ) : (
                            customers.map((c) => (
                                <tr
                                    key={c.uid}
                                    onClick={() => router.push(`/dashboard/customers/${c.uid}`)}
                                    className="hover:bg-muted/30 cursor-pointer transition-colors group"
                                >
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs ring-2 ring-transparent group-hover:ring-pink-500/20 transition-all">
                                                {c.displayName?.charAt(0) || c.email?.charAt(0) || "?"}
                                            </div>
                                            <div className="font-bold text-sm text-foreground group-hover:text-pink-600 transition-colors">
                                                {c.displayName || "Unknown User"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono">{c.email || "No Email"}</span>
                                            <span className="text-[10px] text-muted-foreground">{c.phoneNumber || "No Phone"}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(c.status)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${c.riskScore > 70 ? 'bg-red-500' : c.riskScore > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                    style={{ width: `${c.riskScore}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground">{c.riskScore || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-6 text-xs text-muted-foreground">
                                        {c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleDateString() : "N/A"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
