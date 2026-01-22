import { Customer } from "@/lib/types/customer";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import {
    ShieldAlert,
    AlertTriangle,
    MoreVertical,
    Lock,
    UserX,
    CheckCircle2,
    Eye
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
    customer: Customer;
};

export const CustomerTrustCard = ({ customer }: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const riskScore = customer.riskScore || 0;

    const getRiskColor = (score: number) => {
        if (score >= 80) return "text-danger";
        if (score >= 50) return "text-warning";
        return "text-success";
    };

    const getRiskBg = (score: number) => {
        if (score >= 80) return "bg-danger";
        if (score >= 50) return "bg-warning";
        return "bg-success";
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300">
            {/* Header / Status Banner */}
            <div className={`h-2 ${getRiskBg(riskScore)} opacity-80`} />

            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white uppercase ${getRiskBg(riskScore)}`}>
                            {customer.displayName?.[0] || "U"}
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground line-clamp-1">{customer.displayName || "Unknown User"}</h3>
                            <p className="text-xs text-muted-foreground font-mono">{customer.email}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1 hover:bg-muted rounded-full transition-colors"
                        >
                            <MoreVertical size={16} className="text-muted-foreground" />
                        </button>
                        {/* Simple Menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 top-8 w-40 bg-card border border-border rounded-xl shadow-xl z-20 py-1 flex flex-col">
                                <Link
                                    href={`/dashboard/customers/${customer.uid}`}
                                    className="px-4 py-2 text-xs font-bold hover:bg-muted text-left flex items-center gap-2"
                                >
                                    <Eye size={12} /> View Profile
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Risk Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-3 rounded-xl border border-border/50">
                    <div className="text-center p-2 border-r border-border/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">ID Score</p>
                        <p className={`text-xl font-bold ${getRiskColor(riskScore)}`}>{riskScore}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Strikes</p>
                        <p className={`text-xl font-bold ${customer.strikes > 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                            {customer.strikes || 0}
                        </p>
                    </div>
                </div>

                {/* Tags / Badges */}
                <div className="flex flex-wrap gap-2">
                    {customer.status === 'banned' && (
                        <span className="px-2 py-1 bg-danger/10 text-danger border border-danger/20 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                            <UserX size={10} /> BANNED
                        </span>
                    )}
                    {customer.status === 'suspended' && (
                        <span className="px-2 py-1 bg-warning/10 text-warning border border-warning/20 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                            <Lock size={10} /> SUSPENDED
                        </span>
                    )}
                    {customer.status === 'active' && (
                        <span className="px-2 py-1 bg-success/10 text-success border border-success/20 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 size={10} /> VERIFIED
                        </span>
                    )}
                    {(customer.strikes || 0) > 0 && (
                        <span className="px-2 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
                            <AlertTriangle size={10} /> {customer.strikes} STRIKES
                        </span>
                    )}
                </div>

                {/* Action Footer */}
                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                    <span>Joined {formatDistanceToNow(customer.createdAt instanceof Timestamp ? customer.createdAt.toDate() : new Date())} ago</span>
                    <Link href={`/dashboard/customers/${customer.uid}`} className="text-brand-500 hover:underline">
                        AUDIT LOG &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
};
