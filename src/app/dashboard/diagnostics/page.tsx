"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, doc, getDoc, getDocs, limit, query } from "firebase/firestore";
import { Shield, Database, User, AlertCircle } from "lucide-react";

export default function DiagnosticsPage() {
    const [user, setUser] = useState<any>(null);
    const [adminDoc, setAdminDoc] = useState<any>(null);
    const [barberCount, setBarberCount] = useState<number | null>(null);
    const [sampleBarber, setSampleBarber] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSystem = async () => {
            setLoading(true);
            try {
                // 1. Check Auth
                const currentUser = auth.currentUser;
                setUser(currentUser);

                if (currentUser) {
                    // 2. Check Admin Doc
                    const adminRef = doc(db, "admins", currentUser.uid);
                    const adminSnap = await getDoc(adminRef);
                    setAdminDoc(adminSnap.exists() ? adminSnap.data() : "NOT_FOUND");

                    // 3. Check Barber Applications
                    const barberRef = collection(db, "barber_applications");
                    const q = query(barberRef, limit(1));
                    const barberSnap = await getDocs(q);

                    setBarberCount(barberSnap.size);
                    if (!barberSnap.empty) {
                        setSampleBarber(barberSnap.docs[0].data());
                    }
                }
            } catch (err: any) {
                console.error("Diagnostic Failure:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        checkSystem();
    }, []);

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <header className="flex items-center gap-4 border-b border-border pb-6">
                <Shield className="text-brand-500" size={32} />
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight italic">System Diagnostics</h1>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Verifying Connection & Permissions</p>
                </div>
            </header>

            {loading ? (
                <div className="p-12 text-center animate-pulse text-muted-foreground">Running high-level system check...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Auth Status */}
                    <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-[10px] tracking-widest">
                            <User size={14} /> Identity Provider
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-mono break-all text-foreground">UID: {user?.uid || "Not Authenticated"}</p>
                            <p className="text-xs text-muted-foreground">Email: {user?.email || "N/A"}</p>
                        </div>
                    </div>

                    {/* Admin Record */}
                    <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-brand-500 font-bold uppercase text-[10px] tracking-widest">
                            <Shield size={14} /> Access Control (Firestore)
                        </div>
                        <div className="space-y-2">
                            <p className={`text-sm font-bold ${adminDoc === "NOT_FOUND" ? "text-danger" : "text-success"}`}>
                                Admin Document: {adminDoc === "NOT_FOUND" ? "REJECTED (Missing)" : "VERIFIED"}
                            </p>
                            <pre className="text-[10px] bg-black/50 p-2 rounded max-h-20 overflow-auto">
                                {JSON.stringify(adminDoc, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* Barber Data */}
                    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 md:col-span-2">
                        <div className="flex items-center gap-2 text-orange-500 font-bold uppercase text-[10px] tracking-widest">
                            <Database size={14} /> Data Integrity (barber_applications)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-bold text-foreground">Docs Found: {barberCount}</p>
                                <p className="text-xs text-muted-foreground">Sample Data Available: {sampleBarber ? "YES" : "NO"}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Raw Sample Output:</p>
                                <pre className="text-[10px] bg-black/50 p-4 rounded-xl max-h-60 overflow-auto border border-white/5">
                                    {sampleBarber ? JSON.stringify(sampleBarber, null, 2) : "NO DOCUMENTS FETCHABLE"}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* System Error */}
                    {error && (
                        <div className="md:col-span-2 p-6 rounded-3xl border border-danger/50 bg-danger/10 text-danger flex items-start gap-4">
                            <AlertCircle size={24} className="shrink-0" />
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest mb-1">Critical Exception Logged</p>
                                <p className="text-sm font-mono opacity-80">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <footer className="text-center pt-8">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Authorized Diagnostic Sequence</p>
            </footer>
        </div>
    );
}
