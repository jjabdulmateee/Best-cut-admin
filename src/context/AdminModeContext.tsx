"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AdminMode = "barber" | "customer";

interface AdminModeContextType {
    mode: AdminMode;
    setMode: (mode: AdminMode) => void;
    toggleMode: () => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

const STORAGE_KEY = "admin_mode_preference";

export function AdminModeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<AdminMode>("barber");
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Restore preference on mount
        const saved = localStorage.getItem(STORAGE_KEY) as AdminMode;
        if (saved && (saved === "barber" || saved === "customer")) {
            setModeState(saved);
        }
        setIsInitialized(true);
    }, []);

    const setMode = (newMode: AdminMode) => {
        setModeState(newMode);
        localStorage.setItem(STORAGE_KEY, newMode);
    };

    const toggleMode = () => {
        setMode(mode === "barber" ? "customer" : "barber");
    };

    // Prevent flash of wrong mode by not rendering until checked storage (optional, but good for UX)
    // For now we render immediately with default 'barber' to avoid layout shift, as it's the primary mode.

    return (
        <AdminModeContext.Provider value={{ mode, setMode, toggleMode }}>
            {children}
        </AdminModeContext.Provider>
    );
}

export function useAdminMode() {
    const context = useContext(AdminModeContext);
    if (context === undefined) {
        throw new Error("useAdminMode must be used within an AdminModeProvider");
    }
    return context;
}
