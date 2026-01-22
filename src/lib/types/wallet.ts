export interface Wallet {
    uid: string;
    balance: number;
    escrowBalance: number; // Funds held during active bookings
    updatedAt: any;
}

export interface Transaction {
    id: string;
    userId: string;
    bookingId?: string;
    amount: number;
    type: 'payment' | 'refund' | 'withdrawal' | 'penalty' | 'escrow_hold' | 'escrow_release';
    status: 'pending' | 'completed' | 'failed';
    timestamp: any;
    processedBy?: string;
}
