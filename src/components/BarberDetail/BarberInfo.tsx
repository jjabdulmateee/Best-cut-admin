import { BarberApplication } from "@/lib/types/barber";
import { User } from "lucide-react";

type Props = {
  barber: BarberApplication;
};

const formatDate = (value?: unknown) => {
  if (!value) return "—";
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).toLocaleString();
  }
  if (typeof value === "object" && value && "toDate" in value) {
    // Firebase Timestamp object
    return (value as { toDate: () => Date }).toDate().toLocaleString();
  }
  return "—";
};

export const BarberInfo = ({ barber }: Props) => {
  return (
    <div className="bg-card border border-border rounded-3xl p-8 space-y-8 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <User size={120} />
      </div>

      <div className="flex items-center gap-6 text-foreground">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-3xl font-black shadow-2xl">
          {barber.name[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter">{barber.name}</h2>
          <p className="text-muted-foreground font-medium">{barber.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border/50">
        <InfoBlock label="Unique Identifier (UID)" value={barber.uid} />
        <InfoBlock label="Primary Contact Number" value={barber.phone} />
        <InfoBlock label="Business Identity" value={barber.shopName || "Private Practice (Doorstep Only)"} />
        <InfoBlock label="Network Status" value={barber.accountStatus.toUpperCase()} />
        <InfoBlock label="Submitted" value={formatDate(barber.submittedAt)} />
        {barber.approvedAt && <InfoBlock label="Approved" value={formatDate(barber.approvedAt)} />}
      </div>

      {barber.bio && (
        <div className="space-y-2 pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Professional Bio</p>
          <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-brand-500 pl-4">
            &quot;{barber.bio}&quot;
          </p>
        </div>
      )}
    </div>
  );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-foreground">{value}</p>
  </div>
);
