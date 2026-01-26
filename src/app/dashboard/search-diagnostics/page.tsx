"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import {
    collection,
    query,
    where,
    getDocs,
    limit,
    doc,
    getDoc,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface DiagResult {
    collection: string;
    status: "PASS" | "FAIL" | "PENDING";
    error?: string;
    count?: number;
    sampleData?: string;
}

export default function SearchDiagnosticsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [adminDocExists, setAdminDocExists] = useState<boolean | null>(null);
    const [results, setResults] = useState<DiagResult[]>([
        { collection: "customers", status: "PENDING" },
        { collection: "barber_applications", status: "PENDING" },
        { collection: "barbers", status: "PENDING" },
        { collection: "bookings", status: "PENDING" },
        { collection: "disputes", status: "PENDING" },
    ]);
    const [running, setRunning] = useState(false);
    const [indexErrors, setIndexErrors] = useState<string[]>([]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    const checkAdminDoc = async (uid: string) => {
        try {
            const adminRef = doc(db, "admins", uid);
            const snap = await getDoc(adminRef);
            setAdminDocExists(snap.exists());
            console.log(`[DIAG] Admin doc for ${uid}:`, snap.exists());
        } catch (err: any) {
            console.error("[DIAG] Admin doc check failed:", err);
            setAdminDocExists(false);
        }
    };

    const runDiagnostics = async () => {
        if (!user) return;
        setRunning(true);
        setIndexErrors([]);

        console.log("[DIAG] Starting diagnostics for UID:", user.uid);

        // Check admin doc
        await checkAdminDoc(user.uid);

        // Test each collection
        const collections = [
            { name: "customers", field: "email", searchTerm: "a" },
            { name: "barber_applications", field: "email", searchTerm: "a" },
            { name: "barbers", field: "email", searchTerm: "a" },
            { name: "bookings", field: "status", searchTerm: "completed" },
            { name: "disputes", field: "reason", searchTerm: "a" },
        ];

        const newResults: DiagResult[] = [];

        for (const col of collections) {
            const result: DiagResult = {
                collection: col.name,
                status: "PENDING",
            };

            try {
                console.log(`[DIAG] Testing ${col.name}...`);
                const ref = collection(db, col.name);

                // Simple query - just get some docs
                const q = query(ref, limit(5));
                console.log(`[DIAG] Query for ${col.name}: limit(5)`);

                const snap = await getDocs(q);
                result.status = "PASS";
                result.count = snap.size;

                if (snap.size > 0) {
                    const firstDoc = snap.docs[0].data();
                    result.sampleData = JSON.stringify(
                        Object.keys(firstDoc).slice(0, 5)
                    );
                }

                console.log(
                    `[DIAG] ${col.name}: PASS (${snap.size} docs)`,
                    snap.docs.map((d) => d.id)
                );
            } catch (err: any) {
                result.status = "FAIL";
                result.error = err.message || String(err);
                console.error(`[DIAG] ${col.name}: FAIL`, err);

                // Check for index errors
                if (err.message?.includes("index")) {
                    setIndexErrors((prev) => [...prev, err.message]);
                }
            }

            newResults.push(result);
        }

        setResults(newResults);
        setRunning(false);
    };

    // Test the actual search service
    const testSearchService = async () => {
        if (!user) return;
        console.log("[DIAG] Testing searchService.smartSearch...");

        try {
            // Import dynamically to get fresh instance
            const { searchService } = await import(
                "@/lib/services/searchService"
            );
            const results = await searchService.smartSearch("test");
            console.log("[DIAG] Search service results:", results);
            alert(
                `Search service returned ${results.length} results. Check console for details.`
            );
        } catch (err) {
            console.error("[DIAG] Search service failed:", err);
            alert(`Search service error: ${err}`);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground mb-6">
                🔍 Global Search Diagnostics
            </h1>

            {/* Auth Status */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">
                    1️⃣ Authentication Status
                </h2>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium w-32">Auth State:</span>
                        <span
                            className={
                                user ? "text-green-500" : "text-red-500"
                            }
                        >
                            {user ? "✅ AUTHENTICATED" : "❌ NOT AUTHENTICATED"}
                        </span>
                    </div>
                    {user && (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="font-medium w-32">UID:</span>
                                <code className="bg-muted px-2 py-1 rounded text-xs">
                                    {user.uid}
                                </code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium w-32">Email:</span>
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium w-32">
                                    Admin Doc:
                                </span>
                                <span
                                    className={
                                        adminDocExists === null
                                            ? "text-muted-foreground"
                                            : adminDocExists
                                                ? "text-green-500"
                                                : "text-red-500"
                                    }
                                >
                                    {adminDocExists === null
                                        ? "⏳ Not checked"
                                        : adminDocExists
                                            ? "✅ EXISTS at /admins/" + user.uid
                                            : "❌ NOT FOUND"}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Run Diagnostics */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">
                    2️⃣ Security Rules Test
                </h2>
                <div className="flex gap-4 mb-4">
                    <button
                        onClick={runDiagnostics}
                        disabled={!user || running}
                        className="px-4 py-2 bg-brand-500 text-white rounded-lg disabled:opacity-50"
                    >
                        {running ? "Running..." : "Run Collection Tests"}
                    </button>
                    <button
                        onClick={testSearchService}
                        disabled={!user}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:opacity-50"
                    >
                        Test Search Service
                    </button>
                </div>

                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-border">
                            <th className="py-2">Collection</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((r) => (
                            <tr
                                key={r.collection}
                                className="border-b border-border/50"
                            >
                                <td className="py-2 font-mono">
                                    {r.collection}
                                </td>
                                <td className="py-2">
                                    {r.status === "PASS" && (
                                        <span className="text-green-500">
                                            ✅ PASS
                                        </span>
                                    )}
                                    {r.status === "FAIL" && (
                                        <span className="text-red-500">
                                            ❌ FAIL
                                        </span>
                                    )}
                                    {r.status === "PENDING" && (
                                        <span className="text-muted-foreground">
                                            ⏳ Pending
                                        </span>
                                    )}
                                </td>
                                <td className="py-2 text-muted-foreground text-xs max-w-xs truncate">
                                    {r.error
                                        ? r.error
                                        : r.count !== undefined
                                            ? `${r.count} docs found`
                                            : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Index Errors */}
            {indexErrors.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-yellow-500 mb-2">
                        ⚠️ Index Errors Detected
                    </h2>
                    <ul className="text-sm text-yellow-200 space-y-1">
                        {indexErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Expected Rules Analysis */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                    3️⃣ Security Rules Analysis
                </h2>
                <div className="text-sm space-y-2">
                    <p>
                        <strong>customers:</strong>{" "}
                        <span className="text-red-400">
                            ⚠️ NO EXPLICIT RULE - Falls under default deny
                        </span>
                    </p>
                    <p>
                        <strong>barber_applications:</strong>{" "}
                        <span className="text-green-400">
                            ✓ Admin can read (isAdmin())
                        </span>
                    </p>
                    <p>
                        <strong>barbers:</strong>{" "}
                        <span className="text-red-400">
                            ⚠️ NO EXPLICIT RULE - Falls under default deny
                        </span>
                    </p>
                    <p>
                        <strong>bookings:</strong>{" "}
                        <span className="text-green-400">
                            ✓ Admin can read (isAdmin())
                        </span>
                    </p>
                    <p>
                        <strong>disputes:</strong>{" "}
                        <span className="text-green-400">
                            ✓ Admin can read (isAdmin())
                        </span>
                    </p>
                </div>
            </div>

            {/* Console Instructions */}
            <div className="mt-6 p-4 bg-muted rounded-lg text-xs text-muted-foreground">
                <strong>Instructions:</strong> Open DevTools Console (F12) to
                see detailed logs. Click &quot;Run Collection Tests&quot; to
                test direct Firestore reads.
            </div>
        </div>
    );
}
