"use client";

import { useEffect, useState } from "react";
import { subscribeToBarbers } from "@/lib/services/barberService";
import { geoService } from "@/lib/services/geoService";
import { useGeoZones } from "@/hooks/useGeoZones";
import { BarberApplication } from "@/lib/types/barber";
import { GeoZone } from "@/lib/types/geo";
import { BarberMapDetail } from "@/components/Map/BarberMapDetail";
import { MapPlaceholder } from "@/components/Map/MapPlaceholder";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
    Filter, Search, Map as MapIcon,
    Layers, ShieldAlert, Navigation,
    X, Star, MousePointer2, PlusSquare
} from "lucide-react";
import Link from "next/link";
import { GoogleMapView } from "@/components/Map/GoogleMapView";
import { ThemeToggle } from "@/components/ThemeToggle";
import toast from "react-hot-toast";
import { useAdminMode } from "@/context/AdminModeContext";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MapDashboard() {
    const { mode } = useAdminMode();
    const [barbers, setBarbers] = useState<BarberApplication[]>([]);
    const { zones, loading: zonesLoading } = useGeoZones();
    const [loading, setLoading] = useState(true);
    const [selectedBarber, setSelectedBarber] = useState<BarberApplication | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "shop" | "doorstep" | "risk">("all");
    const [isEditorMode, setIsEditorMode] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);

    useEffect(() => {
        // If in Customer Mode, we might want to skip subscribing to barbers entirely
        // But for now we just gate the display. 
        if (mode === 'customer') {
            setShowHeatmap(true); // Default to Heatmap for customers
            setBarbers([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToBarbers("all", (data) => {
            setBarbers(data);
            setLoading(false);

            // Update selected barber data if open
            if (selectedBarber) {
                const updated = data.find(b => b.uid === selectedBarber.uid);
                if (updated) setSelectedBarber(updated);
            }
        });
        return () => unsubscribe();
    }, [selectedBarber?.uid, mode]);

    const filteredBarbers = mode === 'customer' ? [] : barbers.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === "shop") return b.shopService === "approved";
        if (filter === "doorstep") return b.doorstepService === "approved";
        if (filter === "risk") return (b.trust?.avgRating || 0) < 3.5 && (b.trust?.totalReviews || 0) >= 5;

        return true;
    });

    const handleZoneCreated = async (zone: Partial<GeoZone>) => {
        try {
            const name = window.prompt("Enter Zone Name:", "New Supply Zone");
            if (!name) return;

            await geoService.saveGeoZone({
                ...zone,
                name,
                status: "OPEN",
            } as any);

            toast.success("Geo-Zone established");
        } catch (error) {
            toast.error("Failed to save zone");
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden transition-colors">
            {/* Top Navigation */}
            <header className="h-16 border-b border-border bg-card/5 backdrop-blur-md flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={20} />
                    </Link>
                    <div className="h-6 w-px bg-border mx-2" />
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mode === 'barber' ? 'bg-brand-600' : 'bg-purple-600'}`}>
                            <MapIcon size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-foreground leading-none">{mode === 'barber' ? 'MAP HQ' : 'DEMAND HQ'}</h1>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
                                {mode === 'barber' ? 'Real-Time Ops Center' : 'Customer Demand Heatmap'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {mode === 'barber' && (
                        <div className="flex bg-card border border-border rounded-xl p-1">
                            {(['all', 'shop', 'doorstep', 'risk'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}

                    {mode === 'customer' && (
                        <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-500 flex items-center gap-2">
                                <Layers size={12} /> Demand Layers Active
                            </span>
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            placeholder={mode === 'barber' ? "Search active supply..." : "Search regions..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-card border border-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground w-48 focus:outline-none focus:border-brand-500 transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-card border border-border rounded-xl p-1">
                        {mode === 'barber' ? (
                            <>
                                <button
                                    onClick={() => setIsEditorMode(false)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${!isEditorMode ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <Navigation size={12} />
                                    Live Supply
                                </button>
                                <button
                                    onClick={() => setIsEditorMode(true)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${isEditorMode ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    <PlusSquare size={12} />
                                    Zone Editor
                                </button>
                                <div className="w-px h-4 bg-border self-center mx-1" />
                            </>
                        ) : null}

                        <button
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            disabled={mode === 'customer'} // Always on for customer
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${showHeatmap ? "bg-orange-500 text-white shadow-lg shadow-orange-900/20" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Layers size={12} />
                            Heatmap
                        </button>
                    </div>

                    <div className="h-6 w-px bg-border" />

                    {mode === 'barber' && (
                        <>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isEditorMode ? 'bg-warning' : 'bg-success animate-pulse'}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isEditorMode ? 'text-warning' : 'text-success'}`}>
                                    {isEditorMode ? 'Editor' : 'Live'}
                                </span>
                            </div>
                            <div className="h-6 w-px bg-border" />
                        </>
                    )}

                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Supply List */}
                <div className="w-72 bg-card border-r border-border flex flex-col">
                    <div className="p-4 bg-background/50 border-b border-border">
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <span>{mode === 'barber' ? 'Supply Hierarchy' : 'Demand Regions'}</span>
                            <span className={mode === 'barber' ? 'text-brand-400' : 'text-purple-400'}>
                                {mode === 'barber' ? `${filteredBarbers.length} Active` : `${zones.length} Zones`}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-12"><LoadingSpinner /></div>
                        ) : filteredBarbers.map(barber => (
                            <button
                                key={barber.uid}
                                onClick={() => setSelectedBarber(barber)}
                                className={`w-full p-4 border-b border-border/30 text-left hover:bg-white/5 transition-all group ${selectedBarber?.uid === barber.uid ? "bg-brand-900/10 border-r-2 border-r-brand-500" : ""
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-foreground">{barber.name}</span>
                                    {(barber.trust?.avgRating || 0) < 3.5 && (barber.trust?.totalReviews || 0) > 0 && (
                                        <ShieldAlert size={12} className="text-danger" />
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <Navigation size={10} className={barber.mapVisibility ? "text-success" : "text-danger"} />
                                        {(barber.status || 'PENDING').toUpperCase()}
                                    </div>
                                    <div className="flex items-center">
                                        {(barber.trust?.totalReviews || 0) > 0 ? (
                                            <div className="flex items-center gap-0.5 text-yellow-500">
                                                <Star size={8} fill="currentColor" />
                                                <span className="text-[9px] ml-0.5">{barber.trust?.avgRating.toFixed(1)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[8px] font-bold text-blue-400 uppercase bg-blue-400/10 px-1 rounded">NEW</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Map View */}
                <div className="flex-1 relative bg-gray-900">
                    <GoogleMapView
                        barbers={filteredBarbers}
                        zones={zones}
                        onMarkerClick={(b) => setSelectedBarber(b)}
                        selectedBarberId={selectedBarber?.uid}
                        isEditorMode={isEditorMode}
                        onZoneCreated={handleZoneCreated}
                        showHeatmap={showHeatmap}
                    />
                </div>

                {/* Action Panel */}
                {selectedBarber && (
                    <BarberMapDetail
                        barber={selectedBarber}
                        onClose={() => setSelectedBarber(null)}
                        onUpdate={() => { }}
                    />
                )}
            </div>
        </div>
    );
}
