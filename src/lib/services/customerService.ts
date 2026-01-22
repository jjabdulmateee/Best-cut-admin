import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    serverTimestamp,
    orderBy,
    limit,
    setDoc
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { Customer } from "../types/customer";

class CustomerService {
    /**
     * Search customers by email, phone, or name.
     * Note: Firestore text search is limited. Initially supports exact match or simple prefix if configured.
     * For Phase A/B, we will filter client-side or use basic equality for email/phone.
     */
    async searchCustomers(searchTerm: string): Promise<Customer[]> {
        if (!searchTerm) return [];

        const customersRef = collection(db, "customers");
        // Simple exact match logic for MVP
        // Ideally use Algolia or Typesense for full search
        const qEmail = query(customersRef, where("email", "==", searchTerm), limit(5));
        const qPhone = query(customersRef, where("phoneNumber", "==", searchTerm), limit(5));

        const [snapEmail, snapPhone] = await Promise.all([getDocs(qEmail), getDocs(qPhone)]);

        const results: Customer[] = [];
        snapEmail.forEach(doc => results.push({ uid: doc.id, ...doc.data() } as Customer));
        snapPhone.forEach(doc => {
            if (!results.find(c => c.uid === doc.id)) {
                results.push({ uid: doc.id, ...doc.data() } as Customer);
            }
        });

        return results;
    }

    async getAllCustomers(limitCount = 20): Promise<Customer[]> {
        const q = query(collection(db, "customers"), orderBy("createdAt", "desc"), limit(limitCount));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Customer));
    }

    async getCustomer(uid: string): Promise<Customer | null> {
        const ref = doc(db, "customers", uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { uid, ...snap.data() } as Customer;
    }

    async updateStatus(
        uid: string,
        status: Customer['status'],
        reason: string,
        metadata?: Partial<Customer>
    ): Promise<void> {
        const ref = doc(db, "customers", uid);
        const user = auth.currentUser;

        const updateData: any = {
            status,
            "metadata.lastAdminActionAt": serverTimestamp(),
            "metadata.lastAdminAction": status.toUpperCase(),
            ...metadata
        };

        if (status === 'suspended') {
            // Example: Suspension metadata passed in metadata arg
        } else if (status === 'banned') {
            updateData.bannedAt = serverTimestamp();
            updateData.bannedBy = user?.uid;
            updateData.bannedReason = reason;
        }

        await updateDoc(ref, updateData);
        await this.logAction(`CUSTOMER_${status.toUpperCase()}`, uid, { reason });
    }

    private async logAction(
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
    /**
     * Fetches high-risk customers (riskScore > 75 or flagged/suspended/banned).
     */
    async getHighRiskCustomers(limitCount: number = 20): Promise<Customer[]> {
        try {
            const customersRef = collection(db, "customers");
            // Compound queries can be tricky without indexes, so we'll fetch flagged/suspended/banned and local filter high risk scores if needed across broader set in real app.
            // For now, let's query by status which is common index.
            const q = query(
                customersRef,
                where("status", "in", ["suspended", "banned", "flagged"]),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Customer));
        } catch (error) {
            console.error("Error fetching high risk customers:", error);
            throw error;
        }
    }

    /**
     * Fetches customers with recent strikes.
     * Note: In a real app, 'strikes' would probably be a subcollection or separate collection. 
     * For MVP with array, we can't easily index "strikes added last 30 days" without a specific field.
     * We will fetch customers with strikes > 0 and sort/filter.
     */
    async getRecentStrikes(limitCount: number = 20): Promise<Customer[]> {
        try {
            const customersRef = collection(db, "customers");
            const q = query(
                customersRef,
                where("strikes", ">", 0), // Strikes is a number
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Customer));
        } catch (error) {
            console.error("Error fetching recent strikes:", error);
            return [];
        }
    }
}

export const customerService = new CustomerService();
