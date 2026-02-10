import { BarberDocumentUrls } from "@/lib/types/barber";
import { CheckCircle2, Circle, FileText, Camera, User, BadgeCheck } from "lucide-react";

type Props = {
    documents?: BarberDocumentUrls;
};

export const VerificationChecklist = ({ documents }: Props) => {
    const checklist = [
        { label: "Profile Identity", key: "profilePicture", icon: User },
        { label: "CNIC / National ID", key: ["idCard", "idDocument"], icon: FileText },
        { label: "Business Location", key: "shopPhotos", icon: Camera },
        { label: "Professional Credentials", key: "certificates", icon: BadgeCheck },
    ];

    const hasDoc = (key: string | string[]) => {
        if (!documents) return false;
        if (Array.isArray(key)) {
            return key.some(k => {
                const val = documents[k as keyof BarberDocumentUrls];
                return Array.isArray(val) ? val.length > 0 : !!val;
            });
        }
        const val = documents[key as keyof BarberDocumentUrls];
        return Array.isArray(val) ? val.length > 0 : !!val;
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <BadgeCheck size={80} />
            </div>

            <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase mb-6 flex items-center gap-2">
                <BadgeCheck size={14} className="text-brand-500" />
                Verification Inventory
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {checklist.map((item) => {
                    const exists = hasDoc(item.key);
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.label}
                            className={`p-4 rounded-xl border transition-all flex items-center justify-between ${exists
                                    ? "border-success/30 bg-success/5"
                                    : "border-border bg-muted/20 opacity-60"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${exists ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                                    <Icon size={16} />
                                </div>
                                <span className="text-xs font-bold tracking-tight">{item.label}</span>
                            </div>
                            {exists ? (
                                <CheckCircle2 size={16} className="text-success" />
                            ) : (
                                <Circle size={16} className="text-muted-foreground/30" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
