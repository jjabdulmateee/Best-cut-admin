"use client";

import { useState, useCallback } from "react";
import { DrawingManager } from "@react-google-maps/api";
import { GeoZone, GeoZoneStatus } from "@/lib/types/geo";
import { geoService } from "@/lib/services/geoService";
import { Save, Trash2, Shield, Info } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
    onZoneCreated?: (zone: Partial<GeoZone>) => void;
}

export const GeoZoneManager = ({ onZoneCreated }: Props) => {
    const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);

    const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
        const path = polygon.getPath();
        const coordinates = [];
        for (let i = 0; i < path.getLength(); i++) {
            coordinates.push({
                lat: path.getAt(i).lat(),
                lng: path.getAt(i).lng(),
            });
        }

        const newZone: Partial<GeoZone> = {
            name: "New Zone",
            status: "OPEN",
            polygon: coordinates,
            center: coordinates[0], // Simplified center
        };

        onZoneCreated?.(newZone);
        polygon.setMap(null); // Remove the drawn polygon so we can render it as a managed object
    }, [onZoneCreated]);

    return (
        <>
            <DrawingManager
                drawingMode={drawingMode}
                onPolygonComplete={onPolygonComplete}
                options={{
                    drawingControl: true,
                    drawingControlOptions: {
                        position: google.maps.ControlPosition.TOP_CENTER,
                        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                    },
                    polygonOptions: {
                        fillColor: "#3b82f6",
                        fillOpacity: 0.3,
                        strokeWeight: 2,
                        clickable: true,
                        editable: true,
                        zIndex: 1,
                    },
                }}
            />

            {/* Zone Legend/Controls Overlay */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md border border-border p-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Open Zone</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Limited Supply</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-danger" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Closed Zone</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <p className="text-[11px] text-gray-400 flex items-center gap-2">
                    <Info size={14} className="text-brand-400" />
                    Right-click a polygon to edit status or boundaries.
                </p>
            </div>
        </>
    );
};
