"use client";

import React, { Component, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full bg-card border border-danger/20 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="text-danger" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Something Went Wrong</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            The application encountered an unexpected error. Please refresh the page to continue.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-400 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
