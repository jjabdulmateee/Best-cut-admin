"use client";

import { useMemo, useCallback } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, CircleF, PolygonF, HeatmapLayer } from "@react-google-maps/api";
import { BarberApplication } from "@/lib/types/barber";
import { GeoZone } from "@/lib/types/geo";
import { MapPlaceholder } from "./MapPlaceholder";
import { GeoZoneManager } from "./GeoZoneManager";

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: 40.7128, // Default to NYC or center based on supply
    lng: -74.0060,
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
    ],
};

interface Props {
    barbers: BarberApplication[];
    zones?: GeoZone[];
    onMarkerClick: (barber: BarberApplication) => void;
    selectedBarberId?: string;
    isEditorMode?: boolean;
    showHeatmap?: boolean;
    onZoneCreated?: (zone: Partial<GeoZone>) => void;
}

export const GoogleMapView = ({
    barbers,
    zones = [],
    onMarkerClick,
    selectedBarberId,
    isEditorMode = false,
    showHeatmap = false,
    onZoneCreated
}: Props) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: apiKey || "",
        libraries: ["drawing", "places"],
    });

    const center = useMemo(() => {
        if (barbers.length > 0 && barbers[0].shopLocation) {
            return {
                lat: barbers[0].shopLocation.lat,
                lng: barbers[0].shopLocation.lng
            };
        }
        return defaultCenter;
    }, [barbers]);

    const getMarkerIcon = (barber: BarberApplication) => {
        const isSelected = selectedBarberId === barber.uid;
        const isRisk = (barber.trust?.avgRating || 0) < 3.5 && (barber.trust?.totalReviews || 0) >= 5;

        // Phase G: Churn Detection (7+ days inactive)
        const lastActive = barber.lastActiveAt?.toDate ? barber.lastActiveAt.toDate() : new Date(barber.lastActiveAt || 0);
        const isChurned = barber.accountStatus === 'approved' && (Date.now() - lastActive.getTime() > 7 * 24 * 60 * 60 * 1000);

        let color = "#3b82f6"; // Default Blue
        if (barber.accountStatus === "disabled") color = "#ef4444";
        if (barber.accountStatus === "pending") color = "#f59e0b";
        if (isRisk) color = "#7f1d1d"; // Dark Red
        if (isChurned) color = "#9ca3af"; // Gray (Inactivity)

        return {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: color,
            fillOpacity: 1,
            strokeWeight: isSelected ? 3 : 1,
            strokeColor: "#ffffff",
            scale: isSelected ? 2 : 1.5,
            anchor: { x: 12, y: 22 } as any,
        };
    };

    if (!apiKey) return <MapPlaceholder />;
    if (loadError) return <div className="p-4 text-danger">Error loading maps</div>;
    if (!isLoaded) return <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">Loading Map Engine...</div>;

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
            options={mapOptions as any}
        >
            {/* Barber Markers & Radii */}
            {!isEditorMode && barbers.map((barber) => (
                <div key={barber.uid}>
                    {barber.shopLocation && (
                        <>
                            <MarkerF
                                position={{ lat: barber.shopLocation.lat, lng: barber.shopLocation.lng }}
                                onClick={() => onMarkerClick(barber)}
                                icon={getMarkerIcon(barber)}
                            />

                            {/* Doorstep Radius Circle */}
                            {barber.doorstepService === "approved" && barber.shopLocation && (
                                <CircleF
                                    center={{ lat: barber.shopLocation.lat, lng: barber.shopLocation.lng }}
                                    radius={5000} // Default 5km radius
                                    options={{
                                        fillColor: selectedBarberId === barber.uid ? "#3b82f6" : "#6366f1",
                                        fillOpacity: 0.1,
                                        strokeColor: "#6366f1",
                                        strokeOpacity: 0.3,
                                        strokeWeight: 1,
                                        clickable: false,
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            ))}

            {/* Geo-Zones */}
            {zones.map((zone) => (
                <PolygonF
                    key={zone.id}
                    paths={zone.polygon}
                    options={{
                        fillColor: zone.status === "OPEN" ? "#10b981" : zone.status === "LIMITED" ? "#f59e0b" : "#ef4444",
                        fillOpacity: 0.2,
                        strokeColor: zone.status === "OPEN" ? "#10b981" : zone.status === "LIMITED" ? "#f59e0b" : "#ef4444",
                        strokeWeight: 2,
                    }}
                />
            ))}

            {/* Heatmap Layer (Phase G) */}
            {showHeatmap && (
                <HeatmapLayer
                    data={barbers
                        .filter(b => !!b.shopLocation)
                        .map(b => new google.maps.LatLng(b.shopLocation!.lat, b.shopLocation!.lng))
                    }
                    options={{
                        radius: 30,
                        opacity: 0.6,
                    }}
                />
            )}

            {/* Editor Controls */}
            {isEditorMode && (
                <GeoZoneManager onZoneCreated={onZoneCreated} />
            )}
        </GoogleMap>
    );
};
