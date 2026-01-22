import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, AlertCircle, ShieldAlert } from 'lucide-react';
import { Booking, BookingStatus } from '@/lib/types/booking';
import { format } from 'date-fns';

interface Step {
    status: BookingStatus | 'admin_override';
    label: string;
    description?: string;
    timestamp?: Date;
    isCompleted: boolean;
    isAdminAction?: boolean;
}

export const BookingTimeline = ({ booking }: { booking: Booking }) => {
    const steps: Step[] = [
        {
            status: 'requested',
            label: 'Trip Requested',
            timestamp: booking.createdAt.toDate(),
            isCompleted: true
        },
        {
            status: 'accepted',
            label: 'Barber Accepted',
            timestamp: booking.status !== 'requested' ? booking.createdAt.toDate() : undefined, // Placeholder
            isCompleted: !['requested'].includes(booking.status)
        },
        {
            status: 'on_the_way',
            label: 'En Route',
            isCompleted: !['requested', 'accepted'].includes(booking.status)
        },
        {
            status: 'completed',
            label: 'Completed',
            timestamp: booking.completedAt?.toDate(),
            isCompleted: booking.status === 'completed'
        }
    ];

    // Add Admin Override if applicable
    if (booking.cancelledBy === 'admin') {
        steps.splice(steps.length - 1, 0, {
            status: 'admin_override',
            label: 'Admin Intervention',
            description: booking.cancellationReason || 'Force Terminal State',
            timestamp: booking.cancelledAt?.toDate(),
            isCompleted: true,
            isAdminAction: true
        });
    } else if (booking.status === 'cancelled') {
        steps.push({
            status: 'cancelled',
            label: 'Cancelled',
            description: booking.cancellationReason,
            timestamp: booking.cancelledAt?.toDate(),
            isCompleted: true
        });
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Booking Lifecycle</h3>
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-brand-500 before:via-brand-500/50 before:to-transparent">
                {steps.map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4">
                        <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${step.isAdminAction ? 'bg-danger border-danger text-white' :
                                step.isCompleted ? 'bg-brand-500 border-brand-500 text-black' :
                                    'bg-card border-border text-muted-foreground'
                            }`}>
                            {step.isAdminAction ? <ShieldAlert size={18} /> :
                                step.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </div>
                        <div className="flex flex-col pt-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${step.isAdminAction ? 'text-danger' : step.isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </span>
                                {step.timestamp && (
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        {format(step.timestamp, 'HH:mm:ss')}
                                    </span>
                                )}
                            </div>
                            {step.description && (
                                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                                    {step.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
