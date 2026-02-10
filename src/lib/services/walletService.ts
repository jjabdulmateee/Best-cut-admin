import { db } from "../firebase/config";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    doc,
    getDoc,
    getDocs,
    Timestamp,
} from "firebase/firestore";
import {
    Wallet,
    WalletFlags,
    WalletFilter,
    WalletSort,
    WalletStats,
    Transaction,
} from "../types/wallet";

/**
 * WalletService - Read-only wallet operations for Admin App
 * Phase 4.1.A - All data fetched via Firestore snapshots
 * NO direct wallet mutations (all via Cloud Functions)
 */
class WalletService {
    /**
     * Subscribe to all wallets with real-time updates
     */
    subscribeToWallets(
        onUpdate: (wallets: Wallet[]) => void,
        filter?: WalletFilter,
        sort?: WalletSort
    ) {
        let q = query(collection(db, "wallets"));

        // Apply filters
        if (filter?.role && filter.role !== "all") {
            q = query(q, where("role", "==", filter.role));
        }
        if (filter?.isFrozen !== undefined) {
            q = query(q, where("isFrozen", "==", filter.isFrozen));
        }

        // Apply sorting
        if (sort) {
            q = query(q, orderBy(sort.field, sort.direction));
        } else {
            q = query(q, orderBy("updatedAt", "desc"));
        }

        return onSnapshot(
            q,
            (snapshot) => {
                const wallets = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    const wallet: Wallet = {
                        userId: doc.id,
                        balance: data.balance || 0,
                        escrowBalance: data.escrowBalance || 0,
                        role: data.role || "customer",
                        isFrozen: data.isFrozen || false,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    };

                    // Calculate safety flags
                    wallet.flags = this.calculateFlags(wallet);

                    return wallet;
                });

                // Apply client-side filters (for complex conditions)
                let filtered = wallets;

                if (filter?.minBalance !== undefined) {
                    filtered = filtered.filter((w) => w.balance >= filter.minBalance!);
                }
                if (filter?.maxBalance !== undefined) {
                    filtered = filtered.filter((w) => w.balance <= filter.maxBalance!);
                }
                if (filter?.hasEscrow) {
                    filtered = filtered.filter((w) => w.escrowBalance > 0);
                }
                if (filter?.hasFlags) {
                    filtered = filtered.filter((w) => w.flags?.severity !== "none");
                }

                onUpdate(filtered);
            },
            (error) => {
                console.error("Wallet subscription error:", error);
                onUpdate([]);
            }
        );
    }

    /**
     * Get a single wallet by userId
     */
    async getWallet(userId: string): Promise<Wallet | null> {
        try {
            const walletRef = doc(db, "wallets", userId);
            const snap = await getDoc(walletRef);

            if (!snap.exists()) return null;

            const data = snap.data();
            const wallet: Wallet = {
                userId: snap.id,
                balance: data.balance || 0,
                escrowBalance: data.escrowBalance || 0,
                role: data.role || "customer",
                isFrozen: data.isFrozen || false,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            };

            wallet.flags = this.calculateFlags(wallet);

            return wallet;
        } catch (error) {
            console.error("Failed to fetch wallet:", error);
            return null;
        }
    }

    /**
     * Get transaction history for a wallet
     */
    subscribeToTransactions(
        userId: string,
        onUpdate: (transactions: Transaction[]) => void
    ) {
        const q = query(
            collection(db, "transactions"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc")
        );

        return onSnapshot(
            q,
            (snapshot) => {
                const transactions = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as Transaction));
                onUpdate(transactions);
            },
            (error) => {
                console.error("Transaction subscription error:", error);
                onUpdate([]);
            }
        );
    }

    /**
     * Calculate lifetime inflow/outflow for a wallet
     */
    async calculateLifetimeStats(userId: string): Promise<{
        inflow: number;
        outflow: number;
    }> {
        try {
            const q = query(
                collection(db, "transactions"),
                where("userId", "==", userId),
                where("status", "==", "completed")
            );

            const snapshot = await getDocs(q);
            let inflow = 0;
            let outflow = 0;

            snapshot.docs.forEach((doc) => {
                const tx = doc.data();
                const amount = tx.amount || 0;

                if (amount > 0) {
                    inflow += amount;
                } else {
                    outflow += Math.abs(amount);
                }
            });

            return { inflow, outflow };
        } catch (error) {
            console.error("Failed to calculate lifetime stats:", error);
            return { inflow: 0, outflow: 0 };
        }
    }

    /**
     * Calculate wallet statistics
     */
    async calculateStats(wallets: Wallet[]): Promise<WalletStats> {
        const stats: WalletStats = {
            totalWallets: wallets.length,
            totalBalance: 0,
            totalEscrow: 0,
            flaggedWallets: 0,
            frozenWallets: 0,
            customerWallets: 0,
            barberWallets: 0,
        };

        wallets.forEach((wallet) => {
            stats.totalBalance += wallet.balance;
            stats.totalEscrow += wallet.escrowBalance;

            if (wallet.flags?.severity !== "none") {
                stats.flaggedWallets++;
            }
            if (wallet.isFrozen) {
                stats.frozenWallets++;
            }
            if (wallet.role === "customer") {
                stats.customerWallets++;
            } else {
                stats.barberWallets++;
            }
        });

        return stats;
    }

    /**
     * Calculate safety flags for a wallet
     * Phase 4.1.A - Visual indicators only
     */
    private calculateFlags(wallet: Wallet): WalletFlags {
        const flags: WalletFlags = {
            negativeBalance: wallet.balance < 0,
            negativeEscrow: wallet.escrowBalance < 0,
            escrowLockedTooLong: false,
            frozen: wallet.isFrozen || false,
            severity: "none",
        };

        // Check if escrow locked too long (> 24 hours)
        // This requires checking booking timestamps, simplified for now
        if (wallet.escrowBalance > 0) {
            const hoursSinceUpdate =
                (Date.now() - wallet.updatedAt?.toMillis()) / (1000 * 60 * 60);
            flags.escrowLockedTooLong = hoursSinceUpdate > 24;
        }

        // Determine severity
        if (flags.negativeBalance || flags.negativeEscrow) {
            flags.severity = "critical";
        } else if (flags.frozen || flags.escrowLockedTooLong) {
            flags.severity = "warning";
        }

        return flags;
    }
}

export const walletService = new WalletService();
