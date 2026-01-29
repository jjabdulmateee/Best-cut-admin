"use client";
import { useState } from 'react';
import { bookingService } from '@/lib/services/bookingService';
import { Play, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const BookingSimulator = () => {
    const [barberId, setBarberId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [serviceId, setServiceId] = useState('haircut');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await bookingService.requestBooking({
                barberId,
                customerId, // Admin override
                serviceId,
                serviceType: 'shop',
                location: { lat: 0, lng: 0 } // Dummy location
            });
            setResult(res);
        } catch (err: any) {
            setError(err.message || "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
                    <Play size={16} />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Booking Simulator</h3>
                    <p className="text-[10px] text-muted-foreground">Force-request booking via Cloud Function</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Customer UID</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono focus:border-brand-500 focus:outline-none transition-colors"
                        value={customerId}
                        onChange={e => setCustomerId(e.target.value)}
                        placeholder="Required (use known UID)"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Barber UID</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono focus:border-brand-500 focus:outline-none transition-colors"
                        value={barberId}
                        onChange={e => setBarberId(e.target.value)}
                        placeholder="Required (use known UID)"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Service ID</label>
                    <input
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono focus:border-brand-500 focus:outline-none transition-colors"
                        value={serviceId}
                        onChange={e => setServiceId(e.target.value)}
                        placeholder="haircut"
                    />
                </div>

                <button
                    onClick={handleSimulate}
                    disabled={loading || !barberId || !customerId}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                    {loading ? "Processing..." : "Run Simulation"}
                </button>

                {result && (
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-green-500 mb-2">
                            <CheckCircle size={14} />
                            <span className="text-xs font-bold uppercase">Success</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Booking ID:</span>
                                <span className="font-mono text-foreground">{result.bookingId}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Total Escrow:</span>
                                <span className="font-mono text-foreground font-bold">${result.totalPrice}</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-red-500 mb-1">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-bold uppercase">Transaction Failed</span>
                        </div>
                        <p className="text-[10px] text-red-400 break-words font-mono mt-1">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
