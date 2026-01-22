import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { GeoZone } from "../lib/types/geo";

export const useGeoZones = () => {
    const [zones, setZones] = useState<GeoZone[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "geo_zones"), orderBy("updatedAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GeoZone[];
            setZones(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { zones, loading };
};
