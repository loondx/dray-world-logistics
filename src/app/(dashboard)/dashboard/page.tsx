import { FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Panel } from "@/components/dashboard/description-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadTable } from "@/components/loads/load-table";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/document-types";
import { formatTimestamp } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { can, requirePermission } from "@/server/auth/guards";
import { listRecentUploads } from "@/server/documents/document.queries";
import {
  getDashboardCounts,
  getDashboardLists,
  getMonthFinancials,
} from "@/server/services/dashboard.service";
import type { LoadListItem } from "@/server/services/load.queries";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  accent?: boolean;
}) {
  const body = (
    <>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={cn("mt-1 text-2xl font-bold tabular-nums", accent ? "text-brand-blue" : "text-brand-navy")}
      >
        {value}
      </div>
    </>
  );
  const className = "rounded-lg border bg-card px-4 py-3 transition-colors";
  return href ? (
    <Link
      href={href}
      className={cn(
        className,
        "outline-none hover:border-brand-blue focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function LoadsPanel({
  title,
  loads,
  empty,
  href,
  showFinancials,
}: {
  title: string;
  loads: LoadListItem[];
  empty: string;
  href: string;
  showFinancials: boolean;
}) {
  return (
    <Panel
      title={title}
      actions={
        <Button asChild size="xs" variant="ghost">
          <Link href={href}>View all</Link>
        </Button>
      }
    >
      {loads.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="-m-4 overflow-x-auto">
          <LoadTable loads={loads} showFinancials={showFinancials} compact />
        </div>
      )}
    </Panel>
  );
}

export default async function DashboardPage() {
  // Pages authorize independently of the layout: layouts are not re-run on every navigation.
  const user = await requirePermission("loads:read");
  const showFinancials = can(user, "financials:read");
  const [counts, lists, uploads, financials] = await Promise.all([
    getDashboardCounts(),
    getDashboardLists(),
    listRecentUploads(),
    showFinancials ? getMonthFinancials() : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(" ")[0]}.`}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <Stat label="Total loads" value={counts.total} href="/loads" />
        <Stat label="Active" value={counts.active} href="/loads?status=ACTIVE" accent />
        <Stat label="In transit" value={counts.inTransit} href="/loads?status=IN_TRANSIT" />
        <Stat label="Delivered / docs pending" value={counts.delivered} href="/loads?status=DELIVERED" />
        <Stat label="Completed" value={counts.completed} href="/loads?status=COMPLETED" />
        <Stat label="Clients" value={counts.clients} href="/clients" />
        <Stat label="Carriers" value={counts.carriers} href="/carriers" />
      </div>

      {financials ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label={`Client revenue — this month (${financials.loadCount} loads)`}
            value={formatMoney(financials.revenue)}
          />
          <Stat label="Carrier cost — this month" value={formatMoney(financials.cost)} />
          <Stat label="Gross margin — this month" value={formatMoney(financials.margin)} accent />
        </div>
      ) : null}

      <div className="grid gap-4 2xl:grid-cols-2">
        <LoadsPanel
          title="Upcoming pickups (7 days)"
          loads={lists.upcomingPickups}
          empty="No pickups scheduled in the next 7 days."
          href="/loads?status=ACTIVE&sort=pickupDate&dir=asc"
          showFinancials={false}
        />
        <LoadsPanel
          title="Upcoming deliveries (7 days)"
          loads={lists.upcomingDeliveries}
          empty="No deliveries due in the next 7 days."
          href="/loads?status=IN_TRANSIT&sort=deliveryDate&dir=asc"
          showFinancials={false}
        />
        <LoadsPanel
          title="Delivered — awaiting POD"
          loads={lists.awaitingPod}
          empty="Every delivered load has a POD."
          href="/loads?status=DELIVERED"
          showFinancials={false}
        />
        <Panel title="Recently uploaded documents">
          {uploads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploads yet.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {uploads.map((upload) => (
                <li key={upload.id} className="flex items-center gap-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <Link
                    href={`/loads/${upload.load.id}#documents`}
                    className="font-semibold text-brand-navy hover:underline"
                  >
                    #{upload.load.loadNumber}
                  </Link>
                  <span className="truncate">{DOCUMENT_TYPE_LABELS[upload.type]}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {formatTimestamp(upload.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <LoadsPanel
        title="Recent loads"
        loads={lists.recent}
        empty="No loads yet — create your first load."
        href="/loads"
        showFinancials={showFinancials}
      />
    </div>
  );
}
