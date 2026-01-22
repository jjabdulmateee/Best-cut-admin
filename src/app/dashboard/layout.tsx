import type { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminModeProvider } from "@/context/AdminModeContext";
import { DashboardHeader } from "@/components/Layout/DashboardHeader";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <AdminModeProvider>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <DashboardHeader />
            <main>{children}</main>
          </div>
        </AdminModeProvider>
      </AuthGuard>
    </ErrorBoundary>
  );
}
