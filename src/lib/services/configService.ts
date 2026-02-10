import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase/config";
import {
    collection,
    doc,
    onSnapshot,
    query,
    orderBy,
    limit as firestoreLimit,
    Unsubscribe
} from "firebase/firestore";
import { PlatformConfig } from "../types/platform";
import { ConfigVersion, FieldDiff } from "../types/configVersion";

/**
 * Phase 4.2 — Config Service
 * 
 * Manages platform configuration with versioning, rollbacks, and audit trails.
 * All mutations go through Cloud Functions (no direct Firestore writes).
 */

class ConfigService {
    private functions = getFunctions();

    /**
     * Subscribe to active platform config (read-only)
     */
    subscribeToConfig(onUpdate: (config: PlatformConfig) => void): Unsubscribe {
        const configRef = doc(db, "platform", "config");
        return onSnapshot(configRef,
            (snap) => {
                if (snap.exists()) {
                    onUpdate(snap.data() as PlatformConfig);
                }
            },
            (error) => {
                console.error("Config subscription error:", error);
                // Fail gracefully, maybe notify user via toast if possible, 
                // but at least don't crash the React tree.
            }
        );
    }

    /**
     * Update platform config via Cloud Function
     * Creates new version and updates active config
     */
    async updateConfig(
        updates: Partial<PlatformConfig>,
        changeReason: string
    ): Promise<{ success: boolean; versionId: string; message: string }> {
        const updateConfigFn = httpsCallable<
            { updates: Partial<PlatformConfig>; changeReason: string },
            { success: boolean; versionId: string; message: string }
        >(this.functions, "updatePlatformConfig");

        const result = await updateConfigFn({ updates, changeReason });
        return result.data;
    }

    /**
     * Rollback to a previous config version
     * Creates NEW version (rollback is versioned, not a delete)
     */
    async rollbackConfig(
        targetVersionId: string,
        rollbackReason: string
    ): Promise<{ success: boolean; newVersionId: string; message: string }> {
        const rollbackConfigFn = httpsCallable<
            { targetVersionId: string; rollbackReason: string },
            { success: boolean; newVersionId: string; message: string }
        >(this.functions, "rollbackPlatformConfig");

        const result = await rollbackConfigFn({ targetVersionId, rollbackReason });
        return result.data;
    }

    /**
     * Get config version history (paginated)
     */
    async getConfigHistory(
        limitCount: number = 50,
        startAfter?: string
    ): Promise<{ versions: ConfigVersion[]; hasMore: boolean }> {
        const getHistoryFn = httpsCallable<
            { limit: number; startAfter?: string },
            { versions: ConfigVersion[]; hasMore: boolean }
        >(this.functions, "getConfigHistory");

        const result = await getHistoryFn({ limit: limitCount, startAfter });
        return result.data;
    }

    /**
     * Get diff between two config versions
     */
    async getConfigDiff(
        versionA: string,
        versionB: string
    ): Promise<{ diff: FieldDiff[]; versionA: ConfigVersion; versionB: ConfigVersion }> {
        const getDiffFn = httpsCallable<
            { versionA: string; versionB: string },
            { diff: FieldDiff[]; versionA: ConfigVersion; versionB: ConfigVersion }
        >(this.functions, "getConfigDiff");

        const result = await getDiffFn({ versionA, versionB });
        return result.data;
    }

    /**
     * Subscribe to version history (real-time)
     */
    subscribeToVersionHistory(
        onUpdate: (versions: ConfigVersion[]) => void,
        limitCount: number = 50
    ): Unsubscribe {
        const versionsQuery = query(
            collection(db, "platform/config/versions"),
            orderBy("createdAt", "desc"),
            firestoreLimit(limitCount)
        );

        return onSnapshot(versionsQuery,
            (snap) => {
                const versions = snap.docs.map(doc => doc.data() as ConfigVersion);
                onUpdate(versions);
            },
            (error) => {
                console.error("Version history subscription error:", error);
            }
        );
    }

    /**
     * Get a specific version by ID
     */
    async getVersion(versionId: string): Promise<ConfigVersion | null> {
        const versionRef = doc(db, "platform/config/versions", versionId);
        return new Promise((resolve) => {
            const unsubscribe = onSnapshot(versionRef, (snap) => {
                unsubscribe();
                if (snap.exists()) {
                    resolve(snap.data() as ConfigVersion);
                } else {
                    resolve(null);
                }
            });
        });
    }
}

export const configService = new ConfigService();
