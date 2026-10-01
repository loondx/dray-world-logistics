import { formatAppointment } from "@/lib/dates";

type Stop = {
  locationName: string | null;
  addressLine1: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string | null;
  date: Date | null;
  timeFrom: string | null;
  timeTo: string | null;
  appointmentNumber: string | null;
  contact: string | null;
  notes: string | null;
};

export function StopCard({ label, stop }: { label: string; stop: Stop }) {
  const cityLine = [[stop.city, stop.stateProvince].filter(Boolean).join(", "), stop.postalCode]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="rounded-md border bg-background p-3 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className="text-xs font-semibold tabular-nums">
          {formatAppointment(stop.date, stop.timeFrom, stop.timeTo)}
        </span>
      </div>
      <p className="mt-1 font-semibold">{stop.locationName ?? "Location not set"}</p>
      {stop.addressLine1 ? <p>{stop.addressLine1}</p> : null}
      {cityLine ? <p>{cityLine}</p> : null}
      {stop.country ? <p className="text-muted-foreground">{stop.country}</p> : null}
      <div className="mt-2 grid gap-0.5 text-xs">
        {stop.appointmentNumber ? (
          <p>
            <span className="text-muted-foreground">Appt #</span> {stop.appointmentNumber}
          </p>
        ) : null}
        {stop.contact ? (
          <p>
            <span className="text-muted-foreground">Contact</span> {stop.contact}
          </p>
        ) : null}
        {stop.notes ? (
          <p className="whitespace-pre-line">
            <span className="text-muted-foreground">Instructions</span> {stop.notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}
