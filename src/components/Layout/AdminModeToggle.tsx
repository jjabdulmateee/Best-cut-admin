"use client";

import { useAdminMode } from "@/context/AdminModeContext";
import { motion } from "framer-motion";
import { Users, Scissors } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

export function AdminModeToggle() {
    const { mode, setMode } = useAdminMode();
    const router = useRouter();

    const handleSwitch = (newMode: "barber" | "customer") => {
        if (mode === newMode) return;
        setMode(newMode);
        router.push("/dashboard");
    };

    return (
        <div className="bg-muted/30 p-1 rounded-full border border-border flex items-center gap-1 relative overflow-hidden">
            {/* Background Pill Animation */}
            <motion.div
                layout
                className={clsx(
                    "absolute inset-y-1 rounded-full shadow-sm",
                    mode === "barber" ? "bg-background left-1 w-[48%]" : "bg-background right-1 w-[48%]"
                )}
                style={{ width: "calc(50% - 4px)" }}
                initial={false}
                animate={{
                    x: mode === "barber" ? 0 : "100%",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            {/* Barber Option */}
            <button
                onClick={() => handleSwitch("barber")}
                className={clsx(
                    "relative z-10 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors w-32",
                    mode === "barber" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Scissors size={14} className={mode === "barber" ? "text-blue-500" : "text-muted-foreground"} />
                Barber
            </button>

            {/* Customer Option */}
            <button
                onClick={() => handleSwitch("customer")}
                className={clsx(
                    "relative z-10 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors w-32",
                    mode === "customer" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <Users size={14} className={mode === "customer" ? "text-purple-500" : "text-muted-foreground"} />
                Customer
            </button>
        </div>
    );
}
