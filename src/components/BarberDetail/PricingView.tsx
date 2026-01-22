import { Pricing } from "@/lib/types/barber";

type Props = {
    pricing?: Pricing;
};

export const PricingView = ({ pricing }: Props) => {
    if (!pricing) {
        return (
            <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 text-gray-400">
                No pricing information available.
            </div>
        );
    }

    // Helper to format currency (assuming defaults for now, or raw number)
    const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;

    return (
        <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Service Pricing</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PriceItem label="Haircut" value={pricing.haircut} />
                <PriceItem label="Beard" value={pricing.beard} />
                {pricing.facial && <PriceItem label="Facial" value={pricing.facial} />}

                {Object.entries(pricing)
                    .filter(([key]) => !['haircut', 'beard', 'facial'].includes(key))
                    .map(([key, value]) => (
                        typeof value === 'number' ? <PriceItem key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={value} /> : null
                    ))}
            </div>
        </div>
    );
};

const PriceItem = ({ label, value }: { label: string; value: number }) => (
    <div className="p-3 rounded-lg bg-brand-900 border border-brand-700">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-success">${value}</p>
    </div>
);
