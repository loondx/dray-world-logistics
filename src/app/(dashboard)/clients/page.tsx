import { Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterTabs } from "@/components/dashboard/list/filter-tabs";
import { Pagination } from "@/components/dashboard/list/pagination";
import { SearchInput } from "@/components/dashboard/list/search-input";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { can, requirePermission } from "@/server/auth/guards";
import { listClients } from "@/server/services/client.service";
import { firstParam, parsePage } from "@/server/services/pagination";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const user = await requirePermission("masterdata:read");
  const params = await searchParams;
  const q = firstParam(params.q);
  const archived = firstParam(params.status) === "ARCHIVED";
  const result = await listClients({
    q,
    status: archived ? "ARCHIVED" : "ACTIVE",
    page: parsePage(params.page),
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PageHeader
        title="Clients"
        description="Companies you move freight for."
        actions={
          can(user, "masterdata:write") ? (
            <Button asChild>
              <Link href="/clients/new">
                <Plus /> New client
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Search name, contact, phone, city…" />
        <FilterTabs
          pathname="/clients"
          searchParams={params}
          param="status"
          value={archived ? "ARCHIVED" : null}
          options={[
            { value: null, label: "Active" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {result.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? "No clients match your search" : archived ? "No archived clients" : "No clients yet"}
            description={
              q ? "Try a different name, phone or city." : "Add a client once and reuse it on every load."
            }
            action={
              !q && !archived && can(user, "masterdata:write") ? (
                <Button asChild size="sm">
                  <Link href="/clients/new">
                    <Plus /> New client
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Location</TableHead>
                <TableHead className="text-right">Loads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.companyName}
                    </Link>
                    {client.status === "ARCHIVED" ? (
                      <Badge variant="secondary" className="ml-2">
                        Archived
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{client.contactName ?? "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">{client.phone ?? "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{client.email ?? "-"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {[client.city, client.stateProvince].filter(Boolean).join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{client.loadCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Pagination
        pathname="/clients"
        searchParams={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
