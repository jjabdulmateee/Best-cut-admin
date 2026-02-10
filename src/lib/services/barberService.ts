import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { BarberApplication, BarberStatus, ServiceStatus } from "../types/barber";

export const getBarberApplication = async (
  id: string,
): Promise<BarberApplication | null> => {
  const ref = doc(db, "barber_applications", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();

  // Migration Logic on Read
  const normalizedStatus = (data.status || "pending").toLowerCase() as BarberStatus;
  const normalizedAccountStatus = (data.accountStatus || normalizedStatus).toLowerCase() as BarberStatus;

  return {
    uid: id,
    ...data,
    status: normalizedStatus,
    accountStatus: normalizedAccountStatus,
    shopService: (data.shopService || (normalizedStatus === 'approved' ? 'approved' : 'pending')).toLowerCase() as ServiceStatus,
    doorstepService: (data.doorstepService || (normalizedStatus === 'approved' ? 'approved' : 'pending')).toLowerCase() as ServiceStatus,
    trust: data.trust || {
      avgRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    },
    // Phase E Defaults
    mapVisibility: data.mapVisibility ?? (normalizedStatus === 'approved'),
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
        const normalizedStatus = (data.status || "pending").toLowerCase() as BarberStatus;
        const normalizedAccountStatus = (data.accountStatus || normalizedStatus).toLowerCase() as BarberStatus;

        list.push({
          uid: docSnap.id,
          ...data,
          status: normalizedStatus,
          accountStatus: normalizedAccountStatus,
          shopService: (data.shopService || (normalizedStatus === 'approved' ? 'approved' : 'pending')).toLowerCase() as ServiceStatus,
          doorstepService: (data.doorstepService || (normalizedStatus === 'approved' ? 'approved' : 'pending')).toLowerCase() as ServiceStatus,
          trust: data.trust || {
            avgRating: 0,
            totalReviews: 0,
            ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          // Phase E Defaults
          mapVisibility: data.mapVisibility ?? (normalizedStatus === 'approved'),
          shopLocationVerified: data.shopLocationVerified ?? false,
          doorstepRadiusLocked: data.doorstepRadiusLocked ?? true,
        } as BarberApplication);
      });
      onData(list);
    },
    onError,
  );
};
