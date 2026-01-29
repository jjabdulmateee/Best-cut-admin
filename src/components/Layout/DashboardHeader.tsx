"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, Search, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminModeToggle } from "@/components/Layout/AdminModeToggle";
import { GlobalSearchModal } from "@/components/Search/GlobalSearchModal";
import { motion, AnimatePresence } from "framer-motion";

export function DashboardHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const { signOut, user: authUser } = useAuth();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const isRootDashboard = pathname === "/dashboard";

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
                    <AnimatePresence mode="wait">
                        {!isRootDashboard && (
                            <motion.button
                                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -20, scale: 0.8 }}
                                whileHover={{ scale: 1.1, x: -2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => router.back()}
                                className="p-3 rounded-2xl bg-card border border-border hover:border-brand-500/50 hover:bg-brand-500/5 text-muted-foreground hover:text-brand-500 transition-colors shadow-sm cursor-pointer group flex items-center justify-center"
                                title="Go Back"
                            >
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div>
                        <div className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ rotate: 15, scale: 1.1 }}
                                className="p-2 bg-brand-600 rounded-lg text-white"
                            >
                                <LayoutDashboard size={20} />
                            </motion.div>
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
