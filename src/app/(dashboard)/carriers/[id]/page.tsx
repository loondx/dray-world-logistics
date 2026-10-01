import { Archive, ArchiveRestore, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CarrierForm } from "@/components/carriers/carrier-form";
import { InsuranceBadge } from "@/components/carriers/insurance-badge";
import { BackLink } from "@/components/dashboard/back-link";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import { Panel } from "@/components/dashboard/description-list";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { DriverDialog } from "@/components/drivers/driver-dialog";
import { LoadTable } from "@/components/loads/load-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { setCarrierArchivedAction } from "@/features/carriers/actions";
import { setDriverActiveAction } from "@/features/drivers/actions";
import { driverFullName } from "@/lib/labels/people";
import { can, requirePermission } from "@/server/auth/guards";
import { getCarrier } from "@/server/services/carrier.service";
import { listRecentLoads } from "@/server/services/load.queries";

export const metadata: Metadata = { title: "Carrier" };

export default async function CarrierDetailPage({ params }: PageProps<"/carriers/[id]">) {
  const user = await requirePermission("masterdata:read");
  const { id } = await params;
  const carrier = await getCarrier(id);
  if (!carrier) notFound();

  const loads = await listRecentLoads({ carrierId: id }, 15);
  const canWrite = can(user, "masterdata:write");
  const archived = carrier.status === "ARCHIVED";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <BackLink href="/carriers">Carriers</BackLink>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {carrier.legalName}
            {archived ? <Badge variant="secondary">Archived</Badge> : null}
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3">
            {carrier.mcNumber ? <span>MC {carrier.mcNumber}</span> : null}
            {carrier.dotNumber ? <span>DOT {carrier.dotNumber}</span> : null}
            {carrier.phone ? <span>{carrier.phone}</span> : null}
            <span className="inline-flex items-center gap-1">
              Insurance <InsuranceBadge expiry={carrier.insuranceExpiry} />
            </span>
          </span>
        }
        actions={
          canWrite ? (
            <ConfirmActionButton
              action={setCarrierArchivedAction.bind(null, carrier.id, !archived)}
              title={archived ? "Restore carrier?" : "Archive carrier?"}
              description={
                archived
                  ? "The carrier can be assigned to loads again."
                  : "Archived carriers can't be assigned to new loads. Existing loads and documents are kept."
              }
              confirmLabel={archived ? "Restore" : "Archive"}
            >
              {archived ? <ArchiveRestore /> : <Archive />}
              {archived ? "Restore" : "Archive"}
            </ConfirmActionButton>
          ) : null
        }
      />

      <Panel title="Drivers" actions={canWrite && !archived ? <DriverDialog carrierId={carrier.id} /> : null}>
        {carrier.drivers.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="No drivers yet"
            description="Add drivers so they can be picked on loads."
          />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Cell</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Truck #</TableHead>
                  <TableHead>Trailer #</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carrier.drivers.map((driver) => (
                  <TableRow key={driver.id} className={driver.active ? undefined : "opacity-60"}>
                    <TableCell className="font-medium">
                      {driverFullName(driver)}
                      {!driver.active ? (
                        <Badge variant="secondary" className="ml-2">
                          Inactive
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{driver.phone ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{driver.email ?? "—"}</TableCell>
                    <TableCell>{driver.truckNumber ?? "—"}</TableCell>
                    <TableCell>{driver.trailerNumber ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {canWrite ? (
                        <div className="flex justify-end gap-1">
                          <DriverDialog carrierId={carrier.id} driver={driver} />
                          <ConfirmActionButton
                            action={setDriverActiveAction.bind(null, driver.id, !driver.active)}
                            title={driver.active ? "Deactivate driver?" : "Reactivate driver?"}
                            description={
                              driver.active
                                ? "Inactive drivers are hidden when assigning loads. Their load history is kept."
                                : "The driver can be assigned to loads again."
                            }
                            confirmLabel={driver.active ? "Deactivate" : "Reactivate"}
                            variant="ghost"
                            size="xs"
                          >
                            {driver.active ? "Deactivate" : "Reactivate"}
                          </ConfirmActionButton>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Panel
        title="Recent loads"
        actions={
          <Button asChild size="xs" variant="ghost">
            <Link href={`/loads?carrier=${carrier.id}`}>View all</Link>
          </Button>
        }
      >
        {loads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No loads assigned to this carrier yet.</p>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <LoadTable loads={loads} showFinancials={can(user, "financials:read")} compact />
          </div>
        )}
      </Panel>

      {canWrite ? (
        <Panel title="Edit carrier">
          <CarrierForm carrierId={carrier.id} defaults={carrier} />
        </Panel>
      ) : null}
    </div>
  );
}
