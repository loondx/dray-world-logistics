import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";

import { buildHref, type SearchParamsRecord } from "@/components/dashboard/list/url";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LOAD_TYPE_LABELS } from "@/features/loads/equipment";
import { formatDateOnlyShort } from "@/lib/dates";
import { driverFullName, formatCityState } from "@/lib/labels/people";
import { calculateMargin, formatMoney } from "@/lib/money";
import { invoiceTotal } from "@/lib/pdf/mappings/invoice";
import { cn } from "@/lib/utils";
import type { LoadListItem, LoadSortField } from "@/server/services/load.queries";

import { LoadStatusBadge } from "./load-status-badge";

type SortState = { field: LoadSortField; direction: "asc" | "desc" };

function SortHeader({
  label,
  field,
  sort,
  pathname,
  searchParams,
  className,
}: {
  label: string;
  field: LoadSortField;
  sort?: SortState;
  pathname: string;
  searchParams: SearchParamsRecord;
  className?: string;
}) {
  if (!sort) return <TableHead className={className}>{label}</TableHead>;
  const active = sort.field === field;
  const nextDirection = active && sort.direction === "desc" ? "asc" : "desc";
  const Icon = active ? (sort.direction === "desc" ? ArrowDown : ArrowUp) : ArrowUpDown;
  return (
    <TableHead
      className={className}
      aria-sort={active ? (sort.direction === "desc" ? "descending" : "ascending") : "none"}
    >
      <Link
        href={buildHref(pathname, searchParams, { sort: field, dir: nextDirection, page: null })}
        className="inline-flex items-center gap-1 hover:text-foreground"
        scroll={false}
      >
        {label}
        <Icon className={cn("size-3", !active && "opacity-40")} aria-hidden="true" />
      </Link>
    </TableHead>
  );
}

// Operational load table. `sort` enables sortable headers (the full load list);
// omit it for compact embedded lists (client/carrier pages, dashboard).
export function LoadTable({
  loads,
  showFinancials,
  sort,
  pathname = "/loads",
  searchParams = {},
  compact = false,
}: {
  loads: LoadListItem[];
  showFinancials: boolean;
  sort?: SortState;
  pathname?: string;
  searchParams?: SearchParamsRecord;
  compact?: boolean;
}) {
  const sortProps = { sort, pathname, searchParams };
  return (
    <Table className="text-[13px]">
      <TableHeader>
        <TableRow>
          <SortHeader label="Load #" field="loadNumber" {...sortProps} />
          <SortHeader label="Status" field="status" {...sortProps} />
          {!compact ? <TableHead>Type</TableHead> : null}
          <TableHead>Client</TableHead>
          <TableHead>Container #</TableHead>
          <TableHead>Origin</TableHead>
          <TableHead>Destination</TableHead>
          {!compact ? <TableHead>Carrier</TableHead> : null}
          {!compact ? <TableHead>Driver</TableHead> : null}
          <SortHeader label="Pickup" field="pickupDate" {...sortProps} />
          <SortHeader label="Delivery" field="deliveryDate" {...sortProps} />
          {showFinancials ? (
            <>
              <TableHead className="text-right">Billed</TableHead>
              <TableHead className="text-right">Carrier rate</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loads.map((load) => {
          // Billed = client rate + extra charges (what the client is invoiced).
          const billed = load.clientRate === null ? null : invoiceTotal(load);
          const margin = calculateMargin(billed, load.carrierRate);
          return (
            <TableRow key={load.id} className="relative">
              <TableCell className="font-semibold">
                {/* Whole-row link target for mouse users; the load number stays the accessible link. */}
                <Link
                  href={`/loads/${load.id}`}
                  className="text-brand-navy after:absolute after:inset-0 hover:underline"
                >
                  #{load.loadNumber}
                </Link>
              </TableCell>
              <TableCell>
                <LoadStatusBadge status={load.status} />
              </TableCell>
              {!compact ? <TableCell>{LOAD_TYPE_LABELS[load.type]}</TableCell> : null}
              <TableCell className="max-w-44 truncate">{load.client.companyName}</TableCell>
              <TableCell className="font-mono text-xs">{load.containerNumber ?? "-"}</TableCell>
              <TableCell className="max-w-40 truncate">
                {formatCityState(load.pickupCity, load.pickupStateProvince) || load.pickupLocationName || "-"}
              </TableCell>
              <TableCell className="max-w-40 truncate">
                {formatCityState(load.deliveryCity, load.deliveryStateProvince) ||
                  load.deliveryLocationName ||
                  "-"}
              </TableCell>
              {!compact ? (
                <TableCell className="max-w-40 truncate">{load.carrier?.legalName ?? "-"}</TableCell>
              ) : null}
              {!compact ? <TableCell>{load.driver ? driverFullName(load.driver) : "-"}</TableCell> : null}
              <TableCell className="whitespace-nowrap">{formatDateOnlyShort(load.pickupDate)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDateOnlyShort(load.deliveryDate)}</TableCell>
              {showFinancials ? (
                <>
                  <TableCell className="text-right tabular-nums">{formatMoney(billed)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(load.carrierRate)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      margin?.isNegative() ? "text-destructive" : margin ? "text-emerald-700" : "",
                    )}
                  >
                    {formatMoney(margin)}
                  </TableCell>
                </>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
