import { BarberApplication, ServiceStatus } from "@/lib/types/barber";

type Props = {
  barber: BarberApplication;
  onSelect?: (id: string) => void;
};

const badgeColors: Record<BarberApplication["accountStatus"], string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
  disabled: "bg-gray-700 text-gray-300",
};

const serviceColors: Record<ServiceStatus, string> = {
  pending: "text-warning",
  approved: "text-success",
  rejected: "text-danger",
};

export const BarberCard = ({ barber, onSelect }: Props) => {
  const submitted =
    typeof barber.submittedAt === "string" || typeof barber.submittedAt === "number"
      ? new Date(barber.submittedAt).toLocaleString()
      : barber.submittedAt && "toDate" in barber.submittedAt
        ? (barber.submittedAt as { toDate: () => Date }).toDate().toLocaleString()
        : "N/A";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(barber.uid)}
      className="w-full text-left rounded-xl border border-brand-700 bg-brand-800 hover:border-success/60 transition-colors p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{barber.name}</p>
          <p className="text-sm text-gray-400">{barber.email}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${badgeColors[barber.accountStatus]}`}>
          {barber.accountStatus.toUpperCase()}
        </span>
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Shop:</span>
          <span className={`font-medium ${serviceColors[barber.shopService]}`}>
            {barber.shopService.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Doorstep:</span>
          <span className={`font-medium ${serviceColors[barber.doorstepService]}`}>
            {barber.doorstepService.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-400 flex items-center gap-2 border-t border-brand-700 pt-2">
        <span>Submitted:</span>
        <span className="text-gray-200">{submitted}</span>
      </div>
    </button>
  );
};
