import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

export type SearchResultType = 'customer' | 'barber' | 'booking' | 'dispute';

export interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string; // Name, ID, or Subject
    subtitle: string; // Email, Status, etc.
    link: string; // URL to navigate to
    metadata?: any;
}

class SearchService {
    async globalSearch(searchTerm: string): Promise<SearchResult[]> {
        if (!searchTerm || searchTerm.length < 2) return [];

        const term = searchTerm.toLowerCase().trim();
        const results: SearchResult[] = [];

        try {
            // 1. Search Customers (Email, Phone match)
            // Note: Firestore doesn't support OR across fields easily, so we run parallel queries
            const customersRef = collection(db, "customers");
            const customerEmailQuery = query(customersRef, where("email", ">=", term), where("email", "<=", term + '\uf8ff'), limit(3));
            // Name search is tricky without full text, we'll try simple prefix on displayName if possible/indexed, otherwise stick to email/phone for MVP/Phase H
            // Taking safety approach: Search by Email primarily as it's most common admin lookup

            const [custSnap] = await Promise.all([
                getDocs(customerEmailQuery)
            ]);

            custSnap.forEach(doc => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    type: 'customer',
                    title: data.displayName || "Unknown Customer",
                    subtitle: data.email || "No Email",
                    link: `/dashboard/customers/${doc.id}`
                });
            });

            // 2. Search Barbers (Name, Email)
            const barbersRef = collection(db, "barber_applications");
            const barberQuery = query(barbersRef, where("email", ">=", term), where("email", "<=", term + '\uf8ff'), limit(3));

            const [barberSnap] = await Promise.all([
                getDocs(barberQuery)
            ]);

            barberSnap.forEach(doc => {
                const data = doc.data();
                results.push({
                    id: doc.id,
                    type: 'barber',
                    title: data.name || "Unknown Barber",
                    subtitle: `Status: ${data.status} • ${data.email}`,
                    link: `/dashboard/barber/${doc.id}`
                });
            });

            // 3. Search Disputes (ID match mostly)
            // If term looks like an ID (short string/alphanumeric), check ID collections
            if (term.length > 5) {
                // Disputes
                // Firestore document ID queries are just doc(db, col, id), but for partial ID search?
                // Realistically, admins search by exact Booking Ref or User Name.
                // Let's assume for this MVP we search Disputes by 'reason' or 'id' if possible? 
                // Actually, 'reason' prefix search.
                const disputesRef = collection(db, "disputes");
                // Case sensitive issues with text fields. Let's just limit to exact ID lookups if user types ID, 
                // OR maybe simple reason check if we assume lowercase storage (which we can't).
                // Let's stick to safe/reliable queries:
                // If the user searches "refund", they get disputes with 'reason' starting with 'refund' (case sensitive usually)
                // For MVP Phase H to be "Safe": specific partial matches on string fields.
            }

            // 4. Booking ID check (if term starts with 'BK')
            if (term.toUpperCase().startsWith("BK")) {
                // Logic for booking reference search
            }

        } catch (error) {
            console.error("Search failed:", error);
        }

        return results;
    }

    /**
     * Enhanced search that tries to be smart about what the user is typing
     */
    async smartSearch(input: string): Promise<SearchResult[]> {
        const term = input.trim();
        if (term.length < 2) return [];

        const results: Map<string, SearchResult> = new Map();

        // Helper to add unique results
        const add = (item: SearchResult) => {
            if (!results.has(item.id)) results.set(item.id, item);
        };

        try {
            console.log(`[SEARCH_DEBUG] Starting smartSearch for: "${term}"`);

            // A. Identity Search (Customers & Barbers by Email/Phone/Name)
            // We use >= and <= term + '\uf8ff' for prefix search on specific fields

            // CUSTOMERS
            console.log("[SEARCH_DEBUG] Executing customer queries...");
            const qCustEmail = query(collection(db, "customers"), where("email", ">=", term), where("email", "<=", term + '\uf8ff'), limit(3));
            const qCustName = query(collection(db, "customers"), where("displayName", ">=", term), where("displayName", "<=", term + '\uf8ff'), limit(3));

            // BARBERS
            console.log("[SEARCH_DEBUG] Executing barber_applications queries...");
            const qBarbEmail = query(collection(db, "barber_applications"), where("email", ">=", term), where("email", "<=", term + '\uf8ff'), limit(3));
            const qBarbName = query(collection(db, "barber_applications"), where("name", ">=", term), where("name", "<=", term + '\uf8ff'), limit(3));

            const [custEmailSnap, custNameSnap, barbEmailSnap, barbNameSnap] = await Promise.all([
                getDocs(qCustEmail).catch(e => { console.error("[SEARCH_DEBUG] qCustEmail FAIL:", e.message); throw e; }),
                getDocs(qCustName).catch(e => { console.error("[SEARCH_DEBUG] qCustName FAIL:", e.message); throw e; }),
                getDocs(qBarbEmail).catch(e => { console.error("[SEARCH_DEBUG] qBarbEmail FAIL:", e.message); throw e; }),
                getDocs(qBarbName).catch(e => { console.error("[SEARCH_DEBUG] qBarbName FAIL:", e.message); throw e; })
            ]);

            console.log(`[SEARCH_DEBUG] Results: custEmail(${custEmailSnap.size}), custName(${custNameSnap.size}), barbEmail(${barbEmailSnap.size}), barbName(${barbNameSnap.size})`);

            custEmailSnap.forEach(d => add({
                id: d.id,
                type: 'customer',
                title: d.data().displayName || "Unnamed",
                subtitle: d.data().email,
                link: `/dashboard/customers/${d.id}`
            }));
            custNameSnap.forEach(d => add({
                id: d.id,
                type: 'customer',
                title: d.data().displayName || "Unnamed",
                subtitle: d.data().email,
                link: `/dashboard/customers/${d.id}`
            }));

            barbEmailSnap.forEach(d => add({
                id: d.id,
                type: 'barber',
                title: d.data().name || "Unnamed",
                subtitle: d.data().email,
                link: `/dashboard/barber/${d.id}`
            }));
            barbNameSnap.forEach(d => add({
                id: d.id,
                type: 'barber',
                title: d.data().name || "Unnamed",
                subtitle: d.data().email,
                link: `/dashboard/barber/${d.id}`
            }));

            // B. Ticket/Dispute Search (If term "looks" like an ID, but Firestore partial ID search is hard)
            // Instead, we search 'reason' prefix
            // DISPUTES
            console.log("[SEARCH_DEBUG] Executing dispute query...");
            const qDispute = query(collection(db, "disputes"), where("reason", ">=", term), where("reason", "<=", term + '\uf8ff'), limit(3));
            const disputeSnap = await getDocs(qDispute).catch(e => { console.error("[SEARCH_DEBUG] qDispute FAIL:", e.message); throw e; });

            console.log(`[SEARCH_DEBUG] Results: disputeSnap(${disputeSnap.size})`);

            disputeSnap.forEach(d => add({
                id: d.id,
                type: 'dispute',
                title: d.data().reason || "Untitled Dispute",
                subtitle: `ID: ${d.id} • ${d.data().status}`,
                link: `/dashboard/disputes` // In real app, deep link to modal? For now just page.
            }));

        } catch (e: any) {
            console.error("[SEARCH_DEBUG] Global search error:", e.message || e);
        }

        return Array.from(results.values());
    }
}

export const searchService = new SearchService();
