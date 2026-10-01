import { Package, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { AutoSubmitForm } from "@/components/dashboard/list/auto-submit-form";
import { Pagination } from "@/components/dashboard/list/pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { NativeSelect } from "@/components/forms/native-select";
import { LoadTable } from "@/components/loads/load-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOAD_TYPE_LABELS } from "@/features/loads/equipment";
import { parseLoadListParams } from "@/features/loads/list-params";
import { LOAD_STATUS_LABELS, LOAD_STATUS_ORDER } from "@/features/loads/status";
import { toDateInputValue } from "@/lib/dates";
import { can, requirePermission } from "@/server/auth/guards";
import { listCarrierOptions } from "@/server/services/carrier.service";
import { listClientOptions } from "@/server/services/client.service";
import { listLoads } from "@/server/services/load.queries";

export const metadata: Metadata = { title: "Loads" };

const FILTER_KEYS = [
  "q",
  "status",
  "type",
  "client",
  "carrier",
  "driver",
  "pickupFrom",
  "pickupTo",
  "deliveryFrom",
  "deliveryTo",
];

function FilterLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-medium text-muted-foreground">
      {children}
    </label>
  );
}

export default async function LoadsPage({ searchParams }: PageProps<"/loads">) {
  const user = await requirePermission("loads:read");
  const params = await searchParams;
  const filters = parseLoadListParams(params);
  const [result, clients, carriers] = await Promise.all([
    listLoads(filters),
    listClientOptions(),
    listCarrierOptions(),
  ]);
  const hasFilters = FILTER_KEYS.some((key) => params[key]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <PageHeader
        title="Loads"
        description="Search by load #, container #, client, carrier, driver or city."
        actions={
          can(user, "loads:write") ? (
            <Button asChild>
              <Link href="/loads/new">
                <Plus /> Create load
              </Link>
            </Button>
          ) : null
        }
      />

      <AutoSubmitForm className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-10">
        {filters.driverId ? <input type="hidden" name="driver" value={filters.driverId} /> : null}
        {filters.sort !== "loadNumber" || filters.direction !== "desc" ? (
          <>
            <input type="hidden" name="sort" value={filters.sort} />
            <input type="hidden" name="dir" value={filters.direction} />
          </>
        ) : null}
        <div className="grid gap-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <FilterLabel htmlFor="f-q">Search</FilterLabel>
          <Input
            id="f-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Load #, container, client…"
            className="h-9"
          />
        </div>
        <div className="grid gap-1">
          <FilterLabel htmlFor="f-status">Status</FilterLabel>
          <NativeSelect id="f-status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active (in progress)</option>
            {LOAD_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {LOAD_STATUS_LABELS[status]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1">
          <FilterLabel htmlFor="f-type">Type</FilterLabel>
          <NativeSelect id="f-type" name="type" defaultValue={filters.type ?? ""}>
            <option value="">All types</option>
            {Object.entries(LOAD_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1">
          <FilterLabel htmlFor="f-client">Client</FilterLabel>
          <NativeSelect id="f-client" name="client" defaultValue={filters.clientId ?? ""}>
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1">
          <FilterLabel htmlFor="f-carrier">Carrier</FilterLabel>
          <NativeSelect id="f-carrier" name="carrier" defaultValue={filters.carrierId ?? ""}>
            <option value="">All carriers</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.legalName}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1">
          <FilterLabel htmlFor="f-pf">Pickup from</FilterLabel>
          <Input
            id="f-pf"
            name="pickupFrom"
            type="date"
            defaultValue={toDateInputValue(filters.pickupFrom)}
            className="h-9"
          />
        </div>
        <div className="grid gap-1">
          <FilterLabel htmlFor="f-pt">Pickup to</FilterLabel>
          <Input
            id="f-pt"
            name="pickupTo"
            type="date"
            defaultValue={toDateInputValue(filters.pickupTo)}
            className="h-9"
          />
        </div>
        <div className="grid gap-1">
          <FilterLabel htmlFor="f-df">Delivery from</FilterLabel>
          <Input
            id="f-df"
            name="deliveryFrom"
            type="date"
            defaultValue={toDateInputValue(filters.deliveryFrom)}
            className="h-9"
          />
        </div>
        <div className="grid gap-1">
          <FilterLabel htmlFor="f-dt">Delivery to</FilterLabel>
          <Input
            id="f-dt"
            name="deliveryTo"
            type="date"
            defaultValue={toDateInputValue(filters.deliveryTo)}
            className="h-9"
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6 xl:col-span-10">
          <Button type="submit" size="sm">
            Apply
          </Button>
          {hasFilters ? (
            <Button asChild size="sm" variant="ghost">
              <Link href="/loads">Clear filters</Link>
            </Button>
          ) : null}
          <span className="ml-auto text-xs text-muted-foreground">
            {result.total} load{result.total === 1 ? "" : "s"}
          </span>
        </div>
      </AutoSubmitForm>

      <div className="overflow-x-auto rounded-lg border bg-card">
        {result.items.length === 0 ? (
          <EmptyState
            icon={Package}
            title={hasFilters ? "No loads match these filters" : "No loads yet"}
            description={
              hasFilters
                ? "Try widening the date range or clearing filters."
                : "Create your first load to get started."
            }
            action={
              !hasFilters && can(user, "loads:write") ? (
                <Button asChild size="sm">
                  <Link href="/loads/new">
                    <Plus /> Create load
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <LoadTable
            loads={result.items}
            showFinancials={can(user, "financials:read")}
            sort={{ field: filters.sort, direction: filters.direction }}
            pathname="/loads"
            searchParams={params}
          />
        )}
      </div>

      <Pagination
        pathname="/loads"
        searchParams={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
