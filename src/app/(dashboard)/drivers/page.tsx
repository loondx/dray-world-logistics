import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterTabs } from "@/components/dashboard/list/filter-tabs";
import { Pagination } from "@/components/dashboard/list/pagination";
import { SearchInput } from "@/components/dashboard/list/search-input";
import { PageHeader } from "@/components/dashboard/page-header";
import { DriverDialog } from "@/components/drivers/driver-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { driverFullName } from "@/lib/labels/people";
import { can, requirePermission } from "@/server/auth/guards";
import { listCarrierOptions } from "@/server/services/carrier.service";
import { listDrivers } from "@/server/services/driver.service";
import { firstParam, parsePage } from "@/server/services/pagination";

export const metadata: Metadata = { title: "Drivers" };

export default async function DriversPage({ searchParams }: PageProps<"/drivers">) {
  const user = await requirePermission("masterdata:read");
  const params = await searchParams;
  const q = firstParam(params.q);
  const inactive = firstParam(params.status) === "INACTIVE";
  const canWrite = can(user, "masterdata:write");
  const [result, carriers] = await Promise.all([
    listDrivers({ q, active: !inactive, page: parsePage(params.page) }),
    canWrite ? listCarrierOptions() : Promise.resolve([]),
  ]);
  const carrierOptions = carriers.map((carrier) => ({
    value: carrier.id,
    label: carrier.legalName,
    description: carrier.mcNumber ? `MC ${carrier.mcNumber}` : undefined,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PageHeader
        title="Drivers"
        description="Every driver belongs to a carrier."
        actions={canWrite ? <DriverDialog carrierOptions={carrierOptions} /> : null}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Search name, phone, truck #, carrier…" />
        <FilterTabs
          pathname="/drivers"
          searchParams={params}
          param="status"
          value={inactive ? "INACTIVE" : null}
          options={[
            { value: null, label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        {result.items.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title={q ? "No drivers match your search" : "No drivers yet"}
            description="Add drivers here or from a carrier's page."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Cell</TableHead>
                <TableHead>Truck #</TableHead>
                <TableHead>Trailer #</TableHead>
                <TableHead className="text-right">Loads</TableHead>
                {canWrite ? <TableHead className="w-10" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driverFullName(driver)}</TableCell>
                  <TableCell>
                    <Link href={`/carriers/${driver.carrier.id}`} className="hover:underline">
                      {driver.carrier.legalName}
                    </Link>
                  </TableCell>
                  <TableCell>{driver.phone ?? "-"}</TableCell>
                  <TableCell>{driver.truckNumber ?? "-"}</TableCell>
                  <TableCell>{driver.trailerNumber ?? "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Link href={`/loads?driver=${driver.id}`} className="hover:underline">
                      {driver.loadCount}
                    </Link>
                  </TableCell>
                  {canWrite ? (
                    <TableCell>
                      <DriverDialog carrierId={driver.carrier.id} driver={driver} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination
        pathname="/drivers"
        searchParams={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
