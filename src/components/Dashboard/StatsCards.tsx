import { BarberApplication, BarberStatus } from "@/lib/types/barber";
import { Clock, CheckCircle2, XCircle, Ban, Database } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  barbers: BarberApplication[];
};

export const StatsCards = ({ barbers }: Props) => {
  const counts = barbers.reduce(
    (acc, barber) => {
      const status = barber.accountStatus;
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, disabled: 0 } as Record<
      BarberStatus,
      number
    >,
  );

  const cards = [
    { label: "Pending", value: counts.pending, color: "text-warning", bg: "bg-warning/10", icon: <Clock size={16} /> },
    { label: "Approved", value: counts.approved, color: "text-success", bg: "bg-success/10", icon: <CheckCircle2 size={16} /> },
    { label: "Rejected", value: counts.rejected, color: "text-danger", bg: "bg-danger/10", icon: <XCircle size={16} /> },
    { label: "Disabled", value: counts.disabled, color: "text-muted-foreground", bg: "bg-muted", icon: <Ban size={16} /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          key={card.label}
          className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 transition-all hover:border-brand-500/50 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{card.label}</span>
            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black tracking-tighter">{card.value}</span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground opacity-50">
              <Database size={10} />
              ENTRIES
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
