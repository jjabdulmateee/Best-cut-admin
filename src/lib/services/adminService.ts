import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { BarberStatus } from "../types/barber";
import { Admin } from "../types/admin";

class AdminService {
  async checkAdminStatus(uid?: string): Promise<boolean> {
    if (!uid) return false;
    const ref = doc(db, "admins", uid);
    const snap = await getDoc(ref);
    return snap.exists();
  }

  async getAdminDetails(uid: string): Promise<Admin | null> {
    const ref = doc(db, "admins", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { uid, ...(snap.data() as Omit<Admin, "uid">) };
  }

  // Update Global Account Status
  async updateAccountStatus(
    barberId: string,
    status: BarberStatus,
    reason?: string
  ): Promise<void> {
    const barberRef = doc(db, "barber_applications", barberId);
    const user = auth.currentUser;

    // Metadata for the update
    const updateData: Record<string, any> = {
      accountStatus: status,
      status: status, // Keep legacy field in sync
    };

    if (status === "approved") {
      updateData.approvedAt = serverTimestamp();
      updateData.approvedBy = user?.uid;
    } else if (status === "rejected") {
      updateData.rejectedAt = serverTimestamp();
      updateData.rejectedBy = user?.uid;
      updateData.rejectionReason = reason;
    } else if (status === "disabled") {
      updateData.disabledAt = serverTimestamp();
      updateData.disabledBy = user?.uid;
      updateData.disabledReason = reason;
    }

    await updateDoc(barberRef, updateData);

    const actionMap: Record<BarberStatus, string> = {
      approved: "APPROVE_ACCOUNT",
      rejected: "REJECT_ACCOUNT",
      disabled: "DISABLE_ACCOUNT",
      pending: "RESET_ACCOUNT",
    };

    await this.logAction(actionMap[status], barberId, reason ? { reason } : {});
  }

  // Update Service-Specific Status
  async updateServiceStatus(
    barberId: string,
    service: "shopService" | "doorstepService",
    status: "approved" | "rejected",
    reason?: string
  ): Promise<void> {
    const barberRef = doc(db, "barber_applications", barberId);

    await updateDoc(barberRef, {
      [service]: status,
    });

    // Action name construction: APPROVE_SHOP, REJECT_DOORSTEP
    const serviceName = service === "shopService" ? "SHOP" : "DOORSTEP";
    const actionType = status === "approved" ? "APPROVE" : "REJECT";
    const action = `${actionType}_${serviceName}`;

    await this.logAction(action, barberId, reason ? { reason } : {});
  }

  // Legacy method wrapper (to be removed later, or kept for simple usage)
  async updateBarberStatus(
    barberId: string,
    status: BarberStatus,
    metadata?: { reason?: string },
  ): Promise<void> {
    return this.updateAccountStatus(barberId, status, metadata?.reason);
  }

  async logAction(
    action: string,
    targetId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const user = auth.currentUser;
    const ref = doc(collection(db, "admin_logs"));
    await setDoc(ref, {
      action,
      targetId,
      adminId: user?.uid ?? "unknown",
      adminEmail: user?.email ?? "unknown",
      metadata,
      timestamp: serverTimestamp(),
    });
  }
}

export const adminService = new AdminService();
