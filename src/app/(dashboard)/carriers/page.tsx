import { Plus, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterTabs } from "@/components/dashboard/list/filter-tabs";
import { Pagination } from "@/components/dashboard/list/pagination";
import { SearchInput } from "@/components/dashboard/list/search-input";
import { PageHeader } from "@/components/dashboard/page-header";
import { InsuranceBadge } from "@/components/carriers/insurance-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCityState } from "@/lib/labels/people";
import { can, requirePermission } from "@/server/auth/guards";
import { listCarriers } from "@/server/services/carrier.service";
import { firstParam, parsePage } from "@/server/services/pagination";

export const metadata: Metadata = { title: "Carriers" };

export default async function CarriersPage({ searchParams }: PageProps<"/carriers">) {
  const user = await requirePermission("masterdata:read");
  const params = await searchParams;
  const q = firstParam(params.q);
  const archived = firstParam(params.status) === "ARCHIVED";
  const result = await listCarriers({
    q,
    status: archived ? "ARCHIVED" : "ACTIVE",
    page: parsePage(params.page),
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PageHeader
        title="Carriers"
        description="Trucking companies you dispatch loads to, with their drivers."
        actions={
          can(user, "masterdata:write") ? (
            <Button asChild>
              <Link href="/carriers/new">
                <Plus /> New carrier
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Search name, MC #, DOT #, phone…" />
        <FilterTabs
          pathname="/carriers"
          searchParams={params}
          param="status"
          value={archived ? "ARCHIVED" : null}
          options={[
            { value: null, label: "Active" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        {result.items.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={
              q ? "No carriers match your search" : archived ? "No archived carriers" : "No carriers yet"
            }
            description={
              q
                ? "Try the MC number or a different name."
                : "Add a carrier once, then assign it to loads in one click."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Carrier</TableHead>
                <TableHead>MC #</TableHead>
                <TableHead className="hidden md:table-cell">DOT #</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden md:table-cell">Insurance</TableHead>
                <TableHead className="text-right">Drivers</TableHead>
                <TableHead className="text-right">Loads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((carrier) => (
                <TableRow key={carrier.id}>
                  <TableCell className="font-medium">
                    <Link href={`/carriers/${carrier.id}`} className="hover:underline">
                      {carrier.legalName}
                    </Link>
                    {carrier.dba ? (
                      <div className="text-xs text-muted-foreground">DBA {carrier.dba}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{carrier.mcNumber ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{carrier.dotNumber ?? "—"}</TableCell>
                  <TableCell>
                    {[carrier.contactPerson, carrier.phone].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatCityState(carrier.city, carrier.stateProvince) || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <InsuranceBadge expiry={carrier.insuranceExpiry} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{carrier.driverCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{carrier.loadCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination
        pathname="/carriers"
        searchParams={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
