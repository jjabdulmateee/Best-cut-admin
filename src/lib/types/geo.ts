export type GeoZoneStatus = "OPEN" | "LIMITED" | "CLOSED";

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface GeoZone {
    id: string;
    name: string;
    status: GeoZoneStatus;
    polygon: GeoPoint[];
    barberCount: number;
    center: GeoPoint;
    createdAt: any; // Timestamp
    updatedAt: any; // Timestamp
}
