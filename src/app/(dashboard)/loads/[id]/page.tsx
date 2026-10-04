import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/dashboard/back-link";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import { DescriptionList, Panel } from "@/components/dashboard/description-list";
import { DownloadDocumentCard } from "@/components/documents/download-document-card";
import { ChangeStatusDialog } from "@/components/loads/detail/change-status-dialog";
import { ChargesEditor } from "@/components/loads/detail/charges-editor";
import { StopCard } from "@/components/loads/detail/stop-card";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteLoadAction } from "@/features/loads/actions";
import { DIRECTION_LABELS, LOAD_TYPE_LABELS } from "@/features/loads/equipment";
import { LOAD_STATUS_LABELS } from "@/features/loads/status";
import { formatDateOnly, formatTimestamp } from "@/lib/dates";
import { driverFullName, formatCityState } from "@/lib/labels/people";
import { formatWeight } from "@/lib/labels/units";
import { invoiceTotal, paymentTermsLabel, resolvePaymentTermsDays } from "@/lib/pdf/mappings/invoice";
import { calculateMargin, formatMoney, marginPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { can, getCurrentUser, requirePermission } from "@/server/auth/guards";
import { documentDownloadPath } from "@/features/documents/document-types";
import { canViewDocumentType } from "@/server/permissions/document-access";
import { getCompanySettings } from "@/server/services/company-settings.service";
import { getLoadDetail, getLoadNumber, type LoadDetail } from "@/server/services/load.queries";
import { getUserNames } from "@/server/services/user.service";

// Tab title "Load #100001" — only resolved for signed-in users.
export async function generateMetadata({ params }: PageProps<"/loads/[id]">): Promise<Metadata> {
  if (!(await getCurrentUser())) return { title: "Load" };
  const loadNumber = await getLoadNumber((await params).id);
  return { title: loadNumber ? `Load #${loadNumber}` : "Load not found" };
}

function stop(load: LoadDetail, prefix: "pickup" | "delivery") {
  return {
    locationName: load[`${prefix}LocationName`],
    addressLine1: load[`${prefix}AddressLine1`],
    city: load[`${prefix}City`],
    stateProvince: load[`${prefix}StateProvince`],
    postalCode: load[`${prefix}PostalCode`],
    country: load[`${prefix}Country`],
    date: load[`${prefix}Date`],
    timeFrom: load[`${prefix}TimeFrom`],
    timeTo: load[`${prefix}TimeTo`],
    appointmentNumber: load[`${prefix}AppointmentNumber`],
    contact: load[`${prefix}Contact`],
    notes: load[`${prefix}Notes`],
  };
}

export default async function LoadDetailPage({ params }: PageProps<"/loads/[id]">) {
  const user = await requirePermission("loads:read");
  const { id } = await params;
  const load = await getLoadDetail(id);
  if (!load) notFound();

  const showFinancials = can(user, "financials:read");
  const canEdit = can(user, "loads:write");
  const [userNames, settings] = await Promise.all([
    getUserNames(load.statusHistory.map((entry) => entry.changedById)),
    getCompanySettings(),
  ]);

  const origin = formatCityState(load.pickupCity, load.pickupStateProvince) || load.pickupLocationName;
  const destination =
    formatCityState(load.deliveryCity, load.deliveryStateProvince) || load.deliveryLocationName;
  // Billed = client rate + extra charges; margin is measured against what the client is billed.
  const billed = load.clientRate === null ? null : invoiceTotal(load);
  const margin = calculateMargin(billed, load.carrierRate);
  const percent = marginPercent(billed, load.carrierRate);
  const termsDays = resolvePaymentTermsDays(load.client.paymentTermsDays, settings.invoicePaymentTermsDays);

  const documentCards = [
    {
      type: "CARRIER_RATE_CONFIRMATION" as const,
      title: "Carrier Load Confirmation",
      description: "Carrier rate only. Sent to the carrier.",
      blockedReason: !load.carrier
        ? "Assign a carrier first."
        : load.carrierRate === null
          ? "Enter the carrier rate first."
          : null,
    },
    {
      type: "SHIPPER_RATE_CONFIRMATION" as const,
      title: "Client Rate Confirmation",
      description: "Client rate only. Sent to the client.",
      blockedReason: load.clientRate === null ? "Enter the client rate first." : null,
    },
    {
      type: "BOL" as const,
      title: "Bill of Lading",
      description: "No rates, no client details. For carrier, driver and receiver.",
      blockedReason: null,
    },
    {
      type: "INVOICE" as const,
      title: "Invoice",
      description: `INV-${load.loadNumber}: client rate + extra charges. Send to the client after delivery.`,
      blockedReason: load.clientRate === null ? "Enter the client rate first." : null,
    },
  ].filter((card) => canViewDocumentType(user.role, card.type));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <BackLink href="/loads">Loads</BackLink>

      <header className="flex flex-col gap-3 rounded-lg border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-brand-navy">Load #{load.loadNumber}</h1>
            <LoadStatusBadge status={load.status} className="text-xs" />
            <Badge variant="outline">{LOAD_TYPE_LABELS[load.type]}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <Link href={`/clients/${load.client.id}`} className="font-medium text-foreground hover:underline">
              {load.client.companyName}
            </Link>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              {origin || "Origin TBD"} <ArrowRight className="size-3.5" aria-label="to" />{" "}
              {destination || "Destination TBD"}
            </span>
            {load.containerNumber ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-foreground">{load.containerNumber}</span>
              </>
            ) : null}
          </p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/loads/${load.id}/edit`}>
                <Pencil /> Edit load
              </Link>
            </Button>
            <ChangeStatusDialog loadId={load.id} status={load.status} />
            {load.status === "CREATED" ? (
              <ConfirmActionButton
                action={deleteLoadAction.bind(null, load.id)}
                title={`Delete load #${load.loadNumber}?`}
                description="Use this when a load is cancelled before it starts. The load is removed from lists and totals; the audit log keeps a record. This cannot be undone."
                confirmLabel="Delete load"
                variant="ghost"
              >
                <Trash2 /> Delete
              </ConfirmActionButton>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          <Panel title="Shipment">
            <DescriptionList
              columns={3}
              items={[
                { label: "Load date", value: formatDateOnly(load.loadDate) },
                { label: "Client ref #", value: load.customerReference },
                { label: "Container #", value: load.containerNumber },
                { label: "Booking / B/L #", value: load.bookingNumber },
                { label: "Seal #", value: load.sealNumber },
                { label: "Import / Export", value: load.direction ? DIRECTION_LABELS[load.direction] : null },
                {
                  label: "Equipment",
                  value: [load.equipmentSize, load.equipmentType].filter(Boolean).join(" "),
                },
                { label: "Commodity", value: load.commodity },
                {
                  label: "Weight",
                  value: formatWeight(load.weight, load.weightUnit),
                },
                { label: "Pieces", value: load.pieces },
                { label: "Miles", value: load.miles },
                { label: "Special instructions", value: load.specialInstructions, wide: true },
              ]}
            />
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2">
            <StopCard label="Pickup" stop={stop(load, "pickup")} />
            <StopCard label="Delivery" stop={stop(load, "delivery")} />
          </div>

          {documentCards.length > 0 ? (
            <Panel id="documents" title="Documents">
              <p className="mb-3 text-xs text-muted-foreground">
                Built from this load&apos;s current details each time. Nothing is saved on the server:
                download the PDF and send it.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {documentCards.map((card) => (
                  <DownloadDocumentCard
                    key={card.type}
                    title={card.title}
                    description={card.description}
                    href={documentDownloadPath(load.id, card.type)}
                    blockedReason={card.blockedReason}
                  />
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel title="Timeline">
            <ol className="relative grid gap-3 border-l pl-4">
              {load.statusHistory.map((entry) => (
                <li key={entry.id} className="relative text-sm">
                  <span
                    className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-card bg-brand-blue"
                    aria-hidden="true"
                  />
                  <p>
                    {entry.previousStatus ? (
                      <>
                        {LOAD_STATUS_LABELS[entry.previousStatus]} →{" "}
                        <strong>{LOAD_STATUS_LABELS[entry.newStatus]}</strong>
                      </>
                    ) : (
                      <strong>{LOAD_STATUS_LABELS[entry.newStatus]}</strong>
                    )}
                    {entry.notes ? <span className="text-muted-foreground">: {entry.notes}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(entry.createdAt)} ·{" "}
                    {(entry.changedById && userNames.get(entry.changedById)) || "System"}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="grid content-start gap-4">
          <Panel title="Carrier & driver">
            {load.carrier ? (
              <DescriptionList
                columns={1}
                items={[
                  {
                    label: "Carrier",
                    value: (
                      <Link href={`/carriers/${load.carrier.id}`} className="hover:underline">
                        {load.carrier.legalName}
                      </Link>
                    ),
                  },
                  {
                    label: "MC / DOT",
                    value: [load.carrier.mcNumber, load.carrier.dotNumber].filter(Boolean).join(" / "),
                  },
                  {
                    label: "Dispatch",
                    value: [load.carrier.contactPerson, load.carrier.phone].filter(Boolean).join(" · "),
                  },
                  {
                    label: "Driver",
                    value: load.driver
                      ? [driverFullName(load.driver), load.driver.phone].filter(Boolean).join(" · ")
                      : null,
                  },
                  {
                    label: "Truck / trailer",
                    value: [load.truckNumber, load.trailerNumber].filter(Boolean).join(" / "),
                  },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No carrier assigned yet.{" "}
                {canEdit ? (
                  <Link
                    href={`/loads/${load.id}/edit`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    Assign carrier
                  </Link>
                ) : null}
              </p>
            )}
          </Panel>

          {showFinancials ? (
            <Panel title="Financial (USD)">
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Client rate</dt>
                  <dd className="font-semibold tabular-nums">{formatMoney(load.clientRate)}</dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-muted-foreground">Extra charges (billed to client)</dt>
                  <dd>
                    <ChargesEditor
                      loadId={load.id}
                      canEdit={can(user, "financials:write")}
                      charges={load.charges.map((charge) => ({
                        id: charge.id,
                        description: charge.description,
                        amount: formatMoney(charge.amount),
                      }))}
                    />
                  </dd>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <dt className="font-medium">Invoice total</dt>
                  <dd className="font-bold tabular-nums">{formatMoney(billed)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payment terms</dt>
                  <dd>{paymentTermsLabel(termsDays)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <dt className="text-muted-foreground">Carrier rate</dt>
                  <dd className="font-semibold tabular-nums">{formatMoney(load.carrierRate)}</dd>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <dt className="font-medium">Gross margin</dt>
                  <dd
                    className={cn(
                      "font-bold tabular-nums",
                      margin?.isNegative() ? "text-destructive" : margin ? "text-emerald-700" : "",
                    )}
                  >
                    {formatMoney(margin)}
                    {percent ? (
                      <span className="ml-1 text-xs font-normal">({percent.toFixed(1)}%)</span>
                    ) : null}
                  </dd>
                </div>
              </dl>
            </Panel>
          ) : null}

          <Panel title="Client">
            <DescriptionList
              columns={1}
              items={[
                { label: "Company", value: load.client.companyName },
                {
                  label: "Contact",
                  value: [load.client.contactName, load.client.phone].filter(Boolean).join(" · "),
                },
                { label: "Email", value: load.client.email },
              ]}
            />
          </Panel>

          <Panel title="Internal notes">
            <p className="text-sm whitespace-pre-line">
              {load.internalNotes ?? <span className="text-muted-foreground">No internal notes.</span>}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Staff only. Never printed on documents.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
