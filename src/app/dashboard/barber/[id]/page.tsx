"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { adminService } from "@/lib/services/adminService";
import { getBarberApplication } from "@/lib/services/barberService";
import { BarberApplication, BarberStatus } from "@/lib/types/barber";
import { BarberInfo } from "@/components/BarberDetail/BarberInfo";
import { DocumentsView } from "@/components/BarberDetail/DocumentsView";
import { ServiceControl } from "@/components/BarberDetail/ServiceControl";
import { PricingView } from "@/components/BarberDetail/PricingView";
import { RatingBreakdownView } from "@/components/BarberDetail/RatingBreakdownView";
import { ReviewList } from "@/components/Trust/ReviewList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SecurityActionModal } from "@/components/Security/SecurityActionModal";
import { DisciplinaryPanel } from "@/components/BarberDetail/DisciplinaryPanel";
import { ActionButtons } from "@/components/BarberDetail/ActionButtons";
import { VerificationChecklist } from "@/components/BarberDetail/VerificationChecklist";

export default function BarberDetailPage({ params }: { params: { id: string } }) {
  const [barber, setBarber] = useState<BarberApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [error, setError] = useState<string>();

  const loadBarber = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await getBarberApplication(params.id);
      if (!data) {
        setError("Barber not found");
      }
      setBarber(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load barber");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBarber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleServiceUpdate = async (
    service: "shopService" | "doorstepService",
    status: "approved" | "rejected",
    reason?: string
  ) => {
    if (!barber) return;
    setProcessing(true);
    try {
      await adminService.updateServiceStatus(barber.uid, service, status, reason);
      toast.success(`${service === "shopService" ? "Shop" : "Doorstep"} service updated`);
      await loadBarber();
    } catch (err) {
      toast.error("Failed to update service");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleAccountStatus = async (status: BarberStatus, reason?: string) => {
    if (!barber) return;
    setProcessing(true);
    try {
      await adminService.updateAccountStatus(barber.uid, status, reason);
      toast.success(`Account ${status}`);
      setShowDisableModal(false);
      await loadBarber();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update account status");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-300 p-8">
        <LoadingSpinner />
        <span>Loading barber details…</span>
      </div>
    );
  }

  if (error || !barber) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-lg border border-danger/30 bg-danger/10 text-danger p-4">
          {error || "Barber not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Barber Management</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{barber.name}</h1>
            <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-md border shadow-sm ${barber.accountStatus === 'approved' ? 'border-success/30 text-success bg-success/10' :
              barber.accountStatus === 'disabled' ? 'border-border text-muted-foreground bg-muted/20' :
                'border-warning/30 text-warning bg-warning/10'
              }`}>
              {barber.accountStatus.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <div className="h-6 w-px bg-border hidden md:block" />
          <ThemeToggle />
        </div>
      </div>

      {/* Verification Checklist - The "Where do I confirm" part */}
      <VerificationChecklist documents={barber.documents} />

      {/* Global Account Actions (Always Visible) */}
      <div className="rounded-2xl border border-border bg-card p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-foreground">Operational Decision</h3>
          <p className="text-muted-foreground text-sm max-w-md">Commit a global status change to this partner entity. All actions are cryptographically logged.</p>
        </div>
        <div className="flex gap-4">
          <ActionButtons
            currentStatus={barber.accountStatus}
            onAction={handleAccountStatus}
            disabled={processing}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Docs */}
        <div className="lg:col-span-2 space-y-6">
          <BarberInfo barber={barber} />
          <DocumentsView documents={barber.documents} />
          <PricingView pricing={barber.pricing} />
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6">
          <DisciplinaryPanel barber={barber} onUpdate={loadBarber} />

          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-brand-700 pb-2">Trust Analysis</h2>
            {barber.trust && <RatingBreakdownView trust={barber.trust} />}
            <ReviewList barberId={barber.uid} />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-brand-700 pb-2">Service Control</h2>
            <ServiceControl
              serviceName="Shop Service"
              status={barber.shopService}
              onUpdate={(s, r) => handleServiceUpdate("shopService", s, r)}
              disabled={barber.accountStatus !== 'approved' || processing}
            />
            <ServiceControl
              serviceName="Doorstep Service"
              status={barber.doorstepService}
              onUpdate={(s, r) => handleServiceUpdate("doorstepService", s, r)}
              disabled={barber.accountStatus !== 'approved' || processing}
            />
          </div>

          <div className="pt-8 border-t border-brand-700">
            <h2 className="text-xl font-semibold text-danger mb-4">Danger Zone</h2>

            {barber.accountStatus !== 'disabled' ? (
              <button
                onClick={() => setShowDisableModal(true)}
                className="w-full py-3 border border-danger text-danger rounded-xl hover:bg-danger hover:text-white transition-colors font-semibold"
              >
                Disable Barber Account
              </button>
            ) : (
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center space-y-2">
                <p className="text-gray-400">Account is currently disabled.</p>
                <button
                  onClick={() => handleAccountStatus("approved")} // Allow re-enabling?
                  className="text-success hover:underline text-sm"
                >
                  Re-enable Account
                </button>
              </div>
            )}
          </div>
        </div>

        <SecurityActionModal
          isOpen={showDisableModal}
          onClose={() => setShowDisableModal(false)}
          onConfirm={() => handleAccountStatus("disabled", "Manual Disable from Profile")}
          title="Disable Barber Account"
          impactDetail="This will suspend the barber's access to the app, hide their profile from search results, and stop all active marketing visibility."
          actionLabel="Confirm Suspension"
        />
      </div>
    </div>
  );
}
