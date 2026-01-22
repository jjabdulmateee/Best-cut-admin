import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { BarberApplication, BarberStatus } from "../types/barber";

export const getBarberApplication = async (
  id: string,
): Promise<BarberApplication | null> => {
  const ref = doc(db, "barber_applications", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();

  // Migration Logic on Read
  const status = data.status || "pending";
  return {
    uid: id,
    ...data,
    accountStatus: data.accountStatus || data.status || "pending", // Use new field or fallback to old
    shopService: data.shopService || (data.status === 'approved' ? 'approved' : 'pending'),
    doorstepService: data.doorstepService || (data.status === 'approved' ? 'approved' : 'pending'),
    trust: data.trust || {
      avgRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    // Phase E Defaults
    mapVisibility: data.mapVisibility ?? (data.accountStatus === 'approved' || data.status === 'approved'),
    shopLocationVerified: data.shopLocationVerified ?? false,
    doorstepRadiusLocked: data.doorstepRadiusLocked ?? true,
  } as BarberApplication;
};

export const subscribeToBarbers = (
  status: BarberStatus | "all",
  onData: (items: BarberApplication[]) => void,
  onError?: (error: Error) => void,
  limitCount = 50
) => {
  let baseQuery = collection(db, "barber_applications");

  // Note: Querying mixed data (old vs new fields) is tricky.
  // For now, we query by the legacy 'status' field if we want a specific status,
  // as we are keeping it in sync during updates.
  // Ideally, we would migrate all data in a batch, but "Read Migration" is safer for now.
  const constraints = status === "all" ? [] : [where("status", "==", status)];

  const q = query(baseQuery, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: BarberApplication[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const legacyStatus = data.status || "pending";

        list.push({
          uid: docSnap.id,
          ...data,
          // Migration Logic
          accountStatus: data.accountStatus || legacyStatus,
          shopService: data.shopService || (legacyStatus === 'approved' ? 'approved' : 'pending'),
          doorstepService: data.doorstepService || (legacyStatus === 'approved' ? 'approved' : 'pending'),
          trust: data.trust || {
            avgRating: 0,
            totalReviews: 0,
            ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          // Phase E Defaults
          mapVisibility: data.mapVisibility ?? (legacyStatus === 'approved'),
          shopLocationVerified: data.shopLocationVerified ?? false,
          doorstepRadiusLocked: data.doorstepRadiusLocked ?? true,
        } as BarberApplication);
      });
      onData(list);
    },
    onError,
  );
};
