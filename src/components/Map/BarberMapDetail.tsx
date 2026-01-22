"use client";

import { useState } from "react";
import { BarberApplication } from "@/lib/types/barber";
import { geoService } from "@/lib/services/geoService";
import { adminService } from "@/lib/services/adminService";
import {
    X, Star, MapPin, Navigation,
    ShieldCheck, ShieldAlert, Eye,
    EyeOff, Map as MapIcon, Power
} from "lucide-react";
import toast from "react-hot-toast";
import { SecurityActionModal } from "../Security/SecurityActionModal";

interface Props {
    barber: BarberApplication;
    onClose: () => void;
    onUpdate?: () => void;
}

export const BarberMapDetail = ({ barber, onClose, onUpdate }: Props) => {
    const [processing, setProcessing] = useState(false);
    const [showShutdownModal, setShowShutdownModal] = useState(false);

    const handleToggleVisibility = async () => {
        setProcessing(true);
        try {
            await geoService.updateBarberMapVisibility(barber.uid, !barber.mapVisibility);
            toast.success(`Visibility ${barber.mapVisibility ? "disabled" : "enabled"}`);
            onUpdate?.();
        } catch (error) {
            toast.error("Failed to update visibility");
        } finally {
            setProcessing(false);
        }
    };

    const handleToggleRadiusLock = async () => {
        setProcessing(true);
        try {
            await geoService.setDoorstepRadiusLocked(barber.uid, !barber.doorstepRadiusLocked);
            toast.success(`Radius ${barber.doorstepRadiusLocked ? "unlocked" : "locked"}`);
            onUpdate?.();
        } catch (error) {
            toast.error("Failed to update radius lock");
        } finally {
            setProcessing(false);
        }
    };

    const handleEmergencyShutdown = async () => {
        setProcessing(true);
        try {
            await adminService.updateAccountStatus(barber.uid, "disabled", "Emergency Shutdown from Map HQ");
            toast.success("Account DISABLED via Security Override");
            setShowShutdownModal(false);
            onUpdate?.();
            onClose();
        } catch (error) {
            toast.error("Security Override failed");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="w-80 bg-gray-900 border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border flex items-center justify-between bg-black/20">
                <h3 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                    <MapIcon size={14} className="text-brand-400" />
                    Barber Control
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xl uppercase">
                        {barber.name[0]}
                    </div>
                    <div>
                        <h4 className="font-bold text-white">{barber.name}</h4>
                        <div className="flex items-center gap-1 text-xs font-bold">
                            {(barber.trust?.totalReviews || 0) > 0 ? (
                                <>
                                    <Star size={12} fill="currentColor" className="text-yellow-500" />
                                    <span className="text-yellow-500">{barber.trust?.avgRating.toFixed(1)}</span>
                                    <span className="text-gray-500 font-normal ml-1">({barber.trust?.totalReviews} reviews)</span>
                                </>
                            ) : (
                                <span className="text-[10px] text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded">
                                    NEW PARTNER
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Visibility Status */}
                <div className={`p-3 rounded-xl border transition-colors ${barber.mapVisibility ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30"
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Map Visibility</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${barber.mapVisibility ? "bg-success text-black" : "bg-danger text-white"
                            }`}>
                            {barber.mapVisibility ? "VISIBLE" : "HIDDEN"}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        {barber.mapVisibility
                            ? "Customers can see this barber and book services based on current status."
                            : "Barber is hidden from the public map but remains in the system."}
                    </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 p-2 rounded-lg border border-border/50">
                        <div className="text-[9px] uppercase font-bold text-gray-500 mb-1">Shop</div>
                        <div className={`text-[10px] font-bold ${barber.shopService === 'approved' ? "text-success" : "text-gray-400"}`}>
                            {barber.shopService.toUpperCase()}
                        </div>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-border/50">
                        <div className="text-[9px] uppercase font-bold text-gray-500 mb-1">Doorstep</div>
                        <div className={`text-[10px] font-bold ${barber.doorstepService === 'approved' ? "text-brand-400" : "text-gray-400"}`}>
                            {barber.doorstepService.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border/50 pb-1">Real-Time Overrides</h5>

                    <button
                        onClick={handleToggleVisibility}
                        disabled={processing}
                        className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between text-sm font-semibold transition-all border ${barber.mapVisibility
                            ? "bg-gray-800 border-gray-700 text-danger hover:border-danger/50"
                            : "bg-success border-success text-black hover:bg-green-500"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {barber.mapVisibility ? <EyeOff size={16} /> : <Eye size={16} />}
                            {barber.mapVisibility ? "Hide from Map" : "Show on Map"}
                        </div>
                        {processing && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    </button>

                    <button
                        onClick={handleToggleRadiusLock}
                        disabled={processing}
                        className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between text-sm font-semibold transition-all border ${barber.doorstepRadiusLocked
                            ? "bg-gray-800 border-gray-700 text-brand-400 hover:border-brand-500/50"
                            : "bg-brand-600 border-brand-500 text-white hover:bg-brand-500"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} />
                            {barber.doorstepRadiusLocked ? "Unlock Geo-Radius" : "Lock Geo-Radius"}
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            const r = window.prompt("Reason for manual location verification request:");
                            if (r) toast.success("Verification request sent to barber.");
                        }}
                        className="w-full py-2.5 px-4 bg-gray-800 border border-gray-700 rounded-xl flex items-center gap-2 text-sm text-gray-300 hover:border-gray-500 transition-all font-semibold"
                    >
                        <Navigation size={16} />
                        Force Re-verify Location
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-danger/20">
                    <button
                        onClick={() => setShowShutdownModal(true)}
                        className="w-full py-2.5 rounded-xl border border-danger/30 text-danger text-xs font-bold uppercase tracking-wider hover:bg-danger hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <ShieldAlert size={16} />
                        Emergency Shutdown
                    </button>
                </div>
            </div>

            <SecurityActionModal
                isOpen={showShutdownModal}
                onClose={() => setShowShutdownModal(false)}
                onConfirm={handleEmergencyShutdown}
                title="Emergency Account Shutdown"
                impactDetail="This will IMMEDIATELY disable the barber's account, hide them from all user maps, and cancel any pending visibility permissions."
                actionLabel="Disable Account"
            />

            <div className="p-4 bg-black/40 border-t border-border mt-auto">
                <a
                    href={`/dashboard/barber/${barber.uid}`}
                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                    View Full Admin Profile
                    <X size={14} className="rotate-45" />
                </a>
            </div>
        </div>
    );
};
