import { BarberApplication } from "@/lib/types/barber";
import { BarberCard } from "./BarberCard";

type Props = {
  items: BarberApplication[];
  onSelect: (id: string) => void;
  title?: string;
};

export const BarberList = ({ items, onSelect, title = "Pending barbers" }: Props) => {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 text-center text-gray-400">
        No barbers found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-gray-400">{items.length} total</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((barber) => (
          <BarberCard key={barber.uid} barber={barber} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
};
