"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isUp: boolean;
    };
    colorClass?: string;
}

export const StatTile = ({ title, value, subtitle, icon: Icon, trend, colorClass = "text-brand-400" }: Props) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group hover:border-brand-500/50 transition-colors"
        >
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
                    <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-xl bg-muted group-hover:bg-brand-500/10 transition-colors ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </div>

            {trend && (
                <div className={`mt-4 flex items-center gap-1.5 text-[10px] font-bold ${trend.isUp ? 'text-success' : 'text-danger'}`}>
                    <span>{trend.isUp ? '↑' : '↓'} {trend.value}%</span>
                    <span className="text-muted-foreground uppercase">vs last 24h</span>
                </div>
            )}

            {/* Background Decorative Element */}
            <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <Icon size={80} />
            </div>
        </motion.div>
    );
};
