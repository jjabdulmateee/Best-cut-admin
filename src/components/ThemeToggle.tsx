"use client";

import { useTheme } from "@/context/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center justify-center w-12 h-12 rounded-full border border-border bg-card/50 backdrop-blur-md hover:bg-card transition-all active:scale-90 group overflow-hidden"
            aria-label="Toggle Theme"
        >
            <AnimatePresence mode="wait">
                {theme === "dark" ? (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                    >
                        <Moon size={20} className="text-brand-400" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                    >
                        <Sun size={20} className="text-yellow-500" />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};
