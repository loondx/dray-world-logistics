import { formatDateOnly, todayDateOnly } from "@/lib/dates";
import { cn } from "@/lib/utils";

const WARNING_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Insurance expiry with a visual warning when expired or expiring within 30 days.
export function InsuranceBadge({ expiry }: { expiry: Date | null }) {
  if (!expiry) return <span className="text-muted-foreground">-</span>;
  const daysLeft = Math.round((expiry.getTime() - todayDateOnly().getTime()) / DAY_MS);
  const tone =
    daysLeft < 0 ? "bg-red-50 text-red-800" : daysLeft <= WARNING_DAYS ? "bg-amber-50 text-amber-900" : "";
  return (
    <span className={cn("rounded px-1 text-xs", tone)}>
      {daysLeft < 0 ? "Expired " : ""}
      {formatDateOnly(expiry)}
    </span>
  );
}
