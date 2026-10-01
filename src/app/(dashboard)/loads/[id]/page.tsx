import { ArrowRight, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/dashboard/back-link";
import { DescriptionList, Panel } from "@/components/dashboard/description-list";
import { DocumentTable } from "@/components/documents/document-table";
import { GenerateDocumentCard } from "@/components/documents/generate-document-card";
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog";
import { ChangeStatusDialog } from "@/components/loads/detail/change-status-dialog";
import { StopCard } from "@/components/loads/detail/stop-card";
import { LoadStatusBadge } from "@/components/loads/load-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIRECTION_LABELS, LOAD_TYPE_LABELS } from "@/features/loads/equipment";
import { LOAD_STATUS_LABELS } from "@/features/loads/status";
import { formatDateOnly, formatTimestamp } from "@/lib/dates";
import { getEnv } from "@/lib/env";
import { driverFullName, formatCityState } from "@/lib/labels/people";
import { formatWeight } from "@/lib/labels/units";
import { calculateMargin, formatMoney, marginPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { can, getCurrentUser, requirePermission } from "@/server/auth/guards";
import { toDocumentRows } from "@/server/documents/document-rows";
import { canWriteDocumentType } from "@/server/permissions/document-access";
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

function latestVersion(load: LoadDetail, type: LoadDetail["documents"][number]["type"]): number | null {
  const versions = load.documents
    .filter((d) => d.type === type && d.version !== null)
    .map((d) => d.version ?? 0);
  return versions.length ? Math.max(...versions) : null;
}

export default async function LoadDetailPage({ params }: PageProps<"/loads/[id]">) {
  const user = await requirePermission("loads:read");
  const { id } = await params;
  const load = await getLoadDetail(id);
  if (!load) notFound();

  const showFinancials = can(user, "financials:read");
  const canEdit = can(user, "loads:write");
  const canUpload = can(user, "documents:write");
  const [documents, userNames] = await Promise.all([
    toDocumentRows(load.documents, user),
    getUserNames(load.statusHistory.map((entry) => entry.changedById)),
  ]);
  const generated = documents.filter((d) => d.source === "GENERATED");
  const uploaded = documents.filter((d) => d.source === "UPLOADED");

  const origin = formatCityState(load.pickupCity, load.pickupStateProvince) || load.pickupLocationName;
  const destination =
    formatCityState(load.deliveryCity, load.deliveryStateProvince) || load.deliveryLocationName;
  const margin = calculateMargin(load.clientRate, load.carrierRate);
  const percent = marginPercent(load.clientRate, load.carrierRate);

  const generateCards = [
    {
      type: "CARRIER_RATE_CONFIRMATION" as const,
      title: "Carrier Load Confirmation",
      description: "Carrier rate only — sent to the carrier.",
      blockedReason: !load.carrier
        ? "Assign a carrier first."
        : load.carrierRate === null
          ? "Enter the carrier rate first."
          : null,
    },
    {
      type: "SHIPPER_RATE_CONFIRMATION" as const,
      title: "Customer Rate Confirmation",
      description: "Client rate only — sent to the customer.",
      blockedReason: load.clientRate === null ? "Enter the client rate first." : null,
    },
    {
      type: "BOL" as const,
      title: "Bill of Lading",
      description: "No rates — for shipper, driver and receiver.",
      blockedReason: null,
    },
  ].filter((card) => canWriteDocumentType(user.role, card.type));

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
            {canUpload ? (
              <UploadDocumentDialog
                loadId={load.id}
                maxSizeMb={getEnv().MAX_DOCUMENT_SIZE_MB}
                triggerLabel="Upload POD / doc"
              />
            ) : null}
            <ChangeStatusDialog loadId={load.id} status={load.status} />
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
                { label: "Customer ref #", value: load.customerReference },
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

          <Panel
            id="documents"
            title="Documents"
            actions={
              canUpload ? (
                <UploadDocumentDialog
                  loadId={load.id}
                  maxSizeMb={getEnv().MAX_DOCUMENT_SIZE_MB}
                  triggerLabel="Upload POD / COD / other"
                />
              ) : null
            }
          >
            {generateCards.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {generateCards.map((card) => (
                  <GenerateDocumentCard
                    key={card.type}
                    loadId={load.id}
                    type={card.type}
                    title={card.title}
                    description={card.description}
                    latestVersion={latestVersion(load, card.type)}
                    blockedReason={card.blockedReason}
                  />
                ))}
              </div>
            ) : null}
            <h3 className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Generated documents
            </h3>
            <DocumentTable
              documents={generated}
              canDelete={can(user, "documents:delete")}
              emptyText="Nothing generated yet."
            />
            <h3 className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Uploaded documents (POD, COD, tickets…)
            </h3>
            <DocumentTable
              documents={uploaded}
              canDelete={can(user, "documents:delete")}
              emptyText="No uploads yet."
            />
          </Panel>

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
                    {entry.notes ? <span className="text-muted-foreground"> — {entry.notes}</span> : null}
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
                <div className="flex justify-between">
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
            <p className="mt-2 text-xs text-muted-foreground">Staff only — never printed on documents.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
