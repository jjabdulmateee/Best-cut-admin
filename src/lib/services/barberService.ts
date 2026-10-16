import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { BarberApplication, BarberStatus, ServiceStatus } from "../types/barber";

const BARBER_STATUSES: readonly BarberStatus[] = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "disabled",
];

/** Mobile signup writes "submitted"; the admin queue treats that as pending. */
export const normalizeBarberStatus = (
  raw: unknown,
  fallback: BarberStatus = "pending",
): BarberStatus => {
  const value = typeof raw === "string" ? raw.toLowerCase() : "";
  if (value === "submitted") return "pending";
  if ((BARBER_STATUSES as readonly string[]).includes(value)) {
    return value as BarberStatus;
  }
  return fallback;
};

export const getBarberApplication = async (
  id: string,
): Promise<BarberApplication | null> => {
  const ref = doc(db, "barber_applications", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();

  // Migration Logic on Read. "submitted" (mobile signup) maps to pending.
  const normalizedStatus = normalizeBarberStatus(data.status, "pending");
  const normalizedAccountStatus = data.accountStatus
    ? normalizeBarberStatus(data.accountStatus, normalizedStatus)
    : normalizedStatus;

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

  // Pending queue must include mobile signups stored as "submitted" or "pending".
  const constraints =
    status === "all"
      ? []
      : status === "pending"
        ? [where("status", "in", ["pending", "submitted"])]
        : [where("status", "==", status)];

  const q = query(baseQuery, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: BarberApplication[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const normalizedStatus = normalizeBarberStatus(data.status, "pending");
        const normalizedAccountStatus = data.accountStatus
          ? normalizeBarberStatus(data.accountStatus, normalizedStatus)
          : normalizedStatus;

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
