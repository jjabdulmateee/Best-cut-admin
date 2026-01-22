"use client";

import { AlertTriangle, Map as MapIcon } from "lucide-react";

export const MapPlaceholder = () => {
    return (
        <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-800 m-4 rounded-3xl">
            <div className="w-20 h-20 bg-brand-900/30 rounded-full flex items-center justify-center mb-6 border-2 border-brand-500/20">
                <MapIcon size={40} className="text-brand-400 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Google Maps Key Required</h3>
            <p className="max-w-md text-gray-500 text-sm mb-6">
                To activate the Uber-Grade Map HQ, please add your Google Maps API Key to <code className="text-brand-400 bg-brand-900/20 px-1.5 py-0.5 rounded">.env.local</code> as <code className="text-brand-300">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
            </p>

            <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-start gap-3 text-left max-w-sm">
                <AlertTriangle className="text-brand-400 flex-shrink-0" size={20} />
                <div>
                    <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">Ops Mode: Standby</p>
                    <p className="text-[11px] text-gray-400 leading-normal">
                        Core logistics, supply tracking, and zone management are ACTIVE in the background. Connect your API key to visualize the live fleet.
                    </p>
                </div>
            </div>
        </div>
    );
};
