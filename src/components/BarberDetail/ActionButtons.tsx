"use client";

import { BarberStatus } from "@/lib/types/barber";
import { LoadingSpinner } from "../LoadingSpinner";

type Props = {
  disabled?: boolean;
  onAction: (status: BarberStatus, reason?: string) => Promise<void>;
};

export const ActionButtons = ({ disabled, onAction }: Props) => {
  const handleAction = async (status: BarberStatus) => {
    const needsReason = status === "rejected" || status === "disabled";
    let reason: string | undefined;

    if (needsReason) {
      reason = window.prompt("Please provide a reason") ?? "";
      if (!reason.trim()) return;
    }

    await onAction(status, reason);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <ActionButton
        label="Approve"
        tone="success"
        onClick={() => handleAction("approved")}
        disabled={disabled}
      />
      <ActionButton
        label="Reject"
        tone="danger"
        onClick={() => handleAction("rejected")}
        disabled={disabled}
      />
      <ActionButton
        label="Disable"
        tone="warning"
        onClick={() => handleAction("disabled")}
        disabled={disabled}
      />
    </div>
  );
};

const ActionButton = ({
  label,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  tone: "success" | "danger" | "warning";
  onClick: () => void;
  disabled?: boolean;
}) => {
  const styles: Record<typeof tone, string> = {
    success: "bg-success text-black hover:bg-green-600",
    danger: "bg-danger text-white hover:bg-red-600",
    warning: "bg-warning text-black hover:bg-orange-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-60 ${styles[tone]}`}
    >
      {disabled ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner />
          Processing...
        </span>
      ) : (
        label
      )}
    </button>
  );
};
