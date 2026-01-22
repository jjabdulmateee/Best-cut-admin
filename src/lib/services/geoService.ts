import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    serverTimestamp,
    query,
    orderBy,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { GeoZone } from "../types/geo";
import { adminService } from "./adminService";

class GeoService {
    async saveGeoZone(zone: Omit<GeoZone, "createdAt" | "updatedAt" | "barberCount">): Promise<void> {
        const zoneRef = doc(db, "geo_zones", zone.id || doc(collection(db, "geo_zones")).id);

        const data = {
            ...zone,
            id: zoneRef.id,
            updatedAt: serverTimestamp(),
            createdAt: zone.id ? undefined : serverTimestamp(),
        };

        await setDoc(zoneRef, data, { merge: true });

        await adminService.logAction("GEOZONE_UPDATED", zoneRef.id, {
            name: zone.name,
            status: zone.status
        });
    }

    async updateBarberMapVisibility(barberId: string, visible: boolean): Promise<void> {
        const barberRef = doc(db, "barber_applications", barberId);

        await updateDoc(barberRef, {
            mapVisibility: visible,
            lastLocationUpdate: serverTimestamp(),
        });

        await adminService.logAction(
            visible ? "MAP_VISIBILITY_ENABLED" : "MAP_VISIBILITY_DISABLED",
            barberId,
            {}
        );
    }

    async setShopLocationVerified(barberId: string, verified: boolean): Promise<void> {
        const barberRef = doc(db, "barber_applications", barberId);

        await updateDoc(barberRef, {
            shopLocationVerified: verified,
        });

        await adminService.logAction(
            verified ? "SHOP_LOCATION_VERIFIED" : "SHOP_LOCATION_UNVERIFIED",
            barberId,
            {}
        );
    }

    async setDoorstepRadiusLocked(barberId: string, locked: boolean): Promise<void> {
        const barberRef = doc(db, "barber_applications", barberId);

        await updateDoc(barberRef, {
            doorstepRadiusLocked: locked,
        });

        await adminService.logAction(
            locked ? "RADIUS_LOCKED" : "RADIUS_UNLOCKED",
            barberId,
            {}
        );
    }
}

export const geoService = new GeoService();
