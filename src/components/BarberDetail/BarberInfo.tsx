import { BarberApplication } from "@/lib/types/barber";

type Props = {
  barber: BarberApplication;
};

const formatDate = (value?: unknown) => {
  if (!value) return "—";
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).toLocaleString();
  }
  if (typeof value === "object" && value && "toDate" in value) {
    // Firebase Timestamp object
    return (value as { toDate: () => Date }).toDate().toLocaleString();
  }
  return "—";
};

export const BarberInfo = ({ barber }: Props) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Name</p>
        <p className="font-semibold text-lg text-foreground">{barber.name}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoBlock label="Email" value={barber.email} />
        <InfoBlock label="Phone" value={barber.phone} />
        <InfoBlock label="Shop" value={barber.shopName ?? "—"} />
        <InfoBlock label="Status" value={barber.accountStatus} />
        <InfoBlock label="Submitted" value={formatDate(barber.submittedAt)} />
        {barber.approvedAt && (
          <InfoBlock label="Approved" value={formatDate(barber.approvedAt)} />
        )}
        {barber.rejectedAt && (
          <InfoBlock label="Rejected" value={formatDate(barber.rejectedAt)} />
        )}
        {barber.disabledAt && (
          <InfoBlock label="Disabled" value={formatDate(barber.disabledAt)} />
        )}
        {barber.rejectionReason && (
          <InfoBlock label="Rejection reason" value={barber.rejectionReason} />
        )}
        {barber.disabledReason && (
          <InfoBlock label="Disable reason" value={barber.disabledReason} />
        )}
      </div>
      {barber.bio ? (
        <div>
          <p className="text-sm text-muted-foreground">Bio</p>
          <p className="text-foreground/90">{barber.bio}</p>
        </div>
      ) : null}
    </div>
  );
};

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-foreground">{value}</p>
  </div>
);
