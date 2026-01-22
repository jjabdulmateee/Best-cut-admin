"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ChevronRight, User, Scissors, AlertCircle, FileText } from "lucide-react";
import { searchService, SearchResult } from "@/lib/services/searchService";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const GlobalSearchModal = ({ isOpen, onClose }: Props) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const normalize = query.trim();
        if (normalize.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchService.smartSearch(normalize);
                setResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300); // Debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleSelect = (link: string) => {
        onClose();
        router.push(link);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[70vh]"
                >
                    {/* Header / Input */}
                    <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
                        <Search className="text-muted-foreground" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search customers, barbers, disputes..."
                            className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground/50"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {loading ? (
                            <Loader2 className="animate-spin text-brand-500" size={20} />
                        ) : query.length > 0 ? (
                            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        ) : (
                            <div className="px-2 py-1 bg-muted rounded text-[10px] font-mono text-muted-foreground">ESC</div>
                        )}
                    </div>

                    {/* Results Area */}
                    <div className="overflow-y-auto p-2">
                        {results.length === 0 && query.length > 2 && !loading ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No results found for "{query}"</p>
                            </div>
                        ) : results.length === 0 && query.length < 2 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <p className="text-sm">Type to search across the entire platform.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {/* Render Results */}
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item.link)}
                                        className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted text-left group transition-colors"
                                    >
                                        <div className={`p-2 rounded-lg ${item.type === 'customer' ? 'bg-indigo-500/10 text-indigo-500' :
                                            item.type === 'barber' ? 'bg-brand-500/10 text-brand-500' :
                                                item.type === 'dispute' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-gray-500/10 text-gray-500'
                                            }`}>
                                            {item.type === 'customer' && <User size={18} />}
                                            {item.type === 'barber' && <Scissors size={18} />}
                                            {item.type === 'dispute' && <AlertCircle size={18} />}
                                            {item.type === 'booking' && <FileText size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-foreground truncate">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
                                                <span className="uppercase text-[9px] font-bold tracking-widest bg-background border border-border px-1 rounded">{item.type}</span>
                                                {item.subtitle}
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-border bg-muted/50 text-[10px] text-center text-muted-foreground">
                        Global Search &bull; Press ESC to close
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};


