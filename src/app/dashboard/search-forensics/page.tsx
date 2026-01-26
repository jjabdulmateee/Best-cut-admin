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
    QueryConstraint,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface ForensicResult {
    collection: string;
    exists: boolean | "ERROR";
    docCount: number;
    fields: string[];
    error?: string;
}

interface QueryTest {
    name: string;
    collection: string;
    constraints: string;
    status: "PASS" | "FAIL" | "PENDING";
    error?: string;
    resultsCount?: number;
}

export default function SearchForensicsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [adminDoc, setAdminDoc] = useState<{ exists: boolean, data?: any } | null>(null);
    const [forensics, setForensics] = useState<ForensicResult[]>([]);
    const [queryTests, setQueryTests] = useState<QueryTest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    const runForensics = async () => {
        if (!user) return;
        setLoading(true);
        const results: ForensicResult[] = [];
        const tests: QueryTest[] = [];

        const targetCollections = [
            "customers",
            "barber_applications",
            "barbers",
            "bookings",
            "disputes",
            "admins"
        ];

        // 1. Admin Identity Check
        try {
            const adminRef = doc(db, "admins", user.uid);
            const snap = await getDoc(adminRef);
            setAdminDoc({ exists: snap.exists(), data: snap.exists() ? snap.data() : null });
        } catch (e: any) {
            console.error("Admin check failed", e);
        }

        // 2. Data Reality Check
        for (const colName of targetCollections) {
            try {
                const snap = await getDocs(query(collection(db, colName), limit(1)));
                if (snap.empty) {
                    results.push({ collection: colName, exists: false, docCount: 0, fields: [] });
                } else {
                    const data = snap.docs[0].data();
                    results.push({
                        collection: colName,
                        exists: true,
                        docCount: snap.size,
                        fields: Object.keys(data).sort()
                    });
                }
            } catch (e: any) {
                results.push({
                    collection: colName,
                    exists: "ERROR",
                    docCount: 0,
                    fields: [],
                    error: e.message || String(e)
                });
            }
        }
        setForensics(results);

        // 3. Query Execution Verification (Exact SmartSearch logic)
        const term = "a"; // Test with a common prefix
        const termEnd = term + '\uf8ff';

        const queriesToTest = [
            { id: "cust_email", col: "customers", field: "email", term, termEnd },
            { id: "cust_name", col: "customers", field: "displayName", term, termEnd },
            { id: "barb_email", col: "barber_applications", field: "email", term, termEnd },
            { id: "barb_name", col: "barber_applications", field: "name", term, termEnd },
            { id: "dispute_reason", col: "disputes", field: "reason", term, termEnd },
        ];

        for (const qDef of queriesToTest) {
            const constraints = `where("${qDef.field}", ">=", "${qDef.term}"), where("${qDef.field}", "<=", "${qDef.termEnd}")`;
            try {
                const q = query(
                    collection(db, qDef.col),
                    where(qDef.field, ">=", qDef.term),
                    where(qDef.field, "<=", qDef.termEnd),
                    limit(3)
                );
                const snap = await getDocs(q);
                tests.push({
                    name: qDef.id,
                    collection: qDef.col,
                    constraints,
                    status: "PASS",
                    resultsCount: snap.size
                });
            } catch (e: any) {
                tests.push({
                    name: qDef.id,
                    collection: qDef.col,
                    constraints,
                    status: "FAIL",
                    error: e.message || String(e)
                });
            }
        }
        setQueryTests(tests);
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
            <header className="border-b border-border pb-4">
                <h1 className="text-3xl font-bold">🕵️ Forensic Search Investigation</h1>
                <p className="text-muted-foreground mt-2">Diagnosing Phase H.2 blockers - Environment: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
            </header>

            {!user ? (
                <div className="p-8 bg-yellow-500/10 border border-yellow-500 rounded-xl text-center">
                    Please log in to run forensics.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Identity Check */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-xl font-semibold mb-4">1️⃣ Admin Identity Verification</h2>
                            <div className="space-y-2 text-sm">
                                <p><strong>User UID:</strong> <code>{user.uid}</code></p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>/admins/{user.uid} Document:</strong>
                                    {adminDoc?.exists ? <span className="text-green-500 ml-2">✅ FOUND</span> : <span className="text-red-500 ml-2">❌ NOT FOUND</span>}
                                </p>
                                {adminDoc?.data && (
                                    <pre className="bg-muted p-2 rounded mt-2 text-[10px] overflow-auto max-h-32">
                                        {JSON.stringify(adminDoc.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>

                        {/* Trigger */}
                        <div className="flex flex-col justify-center items-center bg-muted/30 border border-dashed border-border rounded-xl p-6">
                            <button
                                onClick={runForensics}
                                disabled={loading}
                                className="px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? "RUNNING INVESTIGATION..." : "EXECUTE FORENSIC SCAN"}
                            </button>
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                This will perform direct Firestore reads and log exact error codes.
                            </p>
                        </div>
                    </div>

                    {/* 2. Data Reality */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">2️⃣ Data Reality Check (List Collections)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-border">
                                        <th className="pb-2">Collection</th>
                                        <th className="pb-2">Access</th>
                                        <th className="pb-2">Detected Fields</th>
                                        <th className="pb-2">Error Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forensics.map((f, i) => (
                                        <tr key={i} className="border-b border-border/50">
                                            <td className="py-3 font-mono font-bold">{f.collection}</td>
                                            <td className="py-3">
                                                {f.exists === "ERROR" ? (
                                                    <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] border border-red-500/20 uppercase font-black">DENIED</span>
                                                ) : f.exists ? (
                                                    <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] border border-green-500/20 uppercase font-black">READABLE</span>
                                                ) : (
                                                    <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-[10px] border border-yellow-500/20 uppercase font-black">EMPTY</span>
                                                )}
                                            </td>
                                            <td className="py-3">
                                                <div className="flex flex-wrap gap-1 max-w-sm">
                                                    {f.fields.map(field => (
                                                        <span key={field} className="bg-muted px-1 rounded text-[9px] border border-border">{field}</span>
                                                    ))}
                                                    {f.fields.length === 0 && <span className="text-muted-foreground italic text-[10px]">None</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 text-red-400 text-[10px] italic max-w-xs">{f.error || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Query Verification */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">3️⃣ Query Execution Verification (Exact Logic)</h2>
                        <div className="space-y-4">
                            {queryTests.map((t, i) => (
                                <div key={i} className={`p-4 rounded-lg border ${t.status === 'PASS' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Test Case:</span>
                                            <h3 className="font-mono font-bold text-brand-400">{t.name}</h3>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'PASS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] mb-2 text-muted-foreground bg-black/20 p-1 font-mono rounded overflow-auto whitespace-nowrap">
                                        {t.constraints}
                                    </p>
                                    {t.resultsCount !== undefined && (
                                        <p className="text-sm font-bold">Results: <span className={t.resultsCount > 0 ? "text-green-500" : "text-yellow-500"}>{t.resultsCount}</span></p>
                                    )}
                                    {t.error && (
                                        <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400 whitespace-pre-wrap">
                                            <strong>FAILURE REASON:</strong><br />
                                            {t.error}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-muted border border-border rounded-xl text-xs space-y-2">
                        <h3 className="font-bold underline">FORENSIC NOTES:</h3>
                        <ul className="list-disc ml-4 space-y-1">
                            <li><strong>Permission Denied</strong> on Read Test: Rules update was likely not deployed or is incorrect.</li>
                            <li><strong>Readable but Empty Result</strong> on Query: Prefix match case-sensitivity issues? Check if searched fields match exactly.</li>
                            <li><strong>Error Code: 9 (FAILED_PRECONDITION)</strong>: Missing composite index. Click the link that usually appears in browser console to create it.</li>
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}
