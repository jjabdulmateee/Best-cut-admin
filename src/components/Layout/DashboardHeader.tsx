"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminModeToggle } from "@/components/Layout/AdminModeToggle";
import { GlobalSearchModal } from "@/components/Search/GlobalSearchModal";

export function DashboardHeader() {
    const router = useRouter();
    const { signOut, user: authUser } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace("/");
        } catch {
            toast.error("Sign out failed");
        }
    };

    return (
        <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6 mb-8">
                {/* Branding & Mode Switch */}
                <div className="flex items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-600 rounded-lg text-white">
                                <LayoutDashboard size={20} />
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">Best Cut Admin</h1>
                        </div>
                    </div>

                    {/* THE MODE SWITCH */}
                    <div className="h-8 w-px bg-border mx-2 hidden md:block" />
                    <AdminModeToggle />
                </div>

                {/* User & Actions */}
                <div className="flex items-center gap-4">
                    {/* GLOBAL SEARCH TRIGGER */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Global Search (Ctrl+K)"
                    >
                        <Search size={18} />
                    </button>

                    <div className="h-6 w-px bg-border hidden sm:block" />

                    <div className="flex flex-col items-end mr-4 hidden sm:flex">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Authenticated Admin</p>
                        <p className="text-xs font-mono text-brand-400">{authUser?.email}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="p-2 rounded-xl border border-border bg-card hover:bg-danger/10 hover:text-danger transition-all group"
                        title="Sign Out"
                    >
                        <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
