import { CalendarDays, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AttentionList } from "@/components/dashboard/attention-list";
import { ColumnChart } from "@/components/dashboard/charts";
import { Panel } from "@/components/dashboard/description-list";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ScheduleList } from "@/components/dashboard/schedule-list";
import { Button } from "@/components/ui/button";
import { todayDateOnly } from "@/lib/dates";
import { formatMoney, marginPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { can, requirePermission } from "@/server/auth/guards";
import {
  getAttentionItems,
  getDashboardCounts,
  getMonthlyFinancials,
  getUpcomingSchedule,
} from "@/server/services/dashboard.service";

export const metadata: Metadata = { title: "Dashboard" };

const todayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const shortMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const longMonth = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

// One number, one label, one click to the matching list.
function Stat({ label, value, hint, href }: { label: string; value: number; hint: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card px-4 py-3 transition-colors outline-none hover:border-brand-blue focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-bold text-brand-navy">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  // Pages authorize independently of the layout: layouts are not re-run on every navigation.
  const user = await requirePermission("loads:read");
  const showFinancials = can(user, "financials:read");
  const [counts, schedule, attention, financials] = await Promise.all([
    getDashboardCounts(),
    getUpcomingSchedule(),
    getAttentionItems({ showQuotes: can(user, "quotes:read") }),
    showFinancials ? getMonthlyFinancials() : Promise.resolve(null),
  ]);
  const thisMonth = financials?.at(-1);
  const margin = thisMonth ? marginPercent(thisMonth.revenue, thisMonth.cost) : null;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={todayFormat.format(todayDateOnly())}
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Created"
          value={counts.created}
          hint="Booked, not started"
          href="/loads?status=CREATED&sort=pickupDate&dir=asc"
        />
        <Stat
          label="In progress"
          value={counts.inProgress}
          hint="Dispatched or awaiting paperwork"
          href="/loads?status=IN_PROGRESS"
        />
        <Stat
          label="Pickups today"
          value={counts.pickupsToday}
          hint="Appointments today"
          href="/loads?status=ACTIVE&sort=pickupDate&dir=asc"
        />
        <Stat
          label="Deliveries today"
          value={counts.deliveriesToday}
          hint="Appointments today"
          href="/loads?status=ACTIVE&sort=deliveryDate&dir=asc"
        />
      </div>

      {/* DOM order = phone order: problems first, then the schedule. On desktop the schedule
          takes the left two columns and "Needs attention" sits on the right. */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-start-3"
          title={attention.length ? `Needs attention (${attention.length})` : "Needs attention"}
        >
          <AttentionList items={attention} />
        </Panel>
        <Panel
          title="Schedule: next 7 days"
          className="lg:col-span-2 lg:col-start-1 lg:row-start-1"
          actions={
            <Button asChild size="xs" variant="ghost">
              <Link href="/loads?status=ACTIVE&sort=pickupDate&dir=asc">All loads</Link>
            </Button>
          }
        >
          {schedule.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No appointments this week"
              description="Pickups and deliveries with a date in the next 7 days show up here."
            />
          ) : (
            <ScheduleList events={schedule} />
          )}
        </Panel>
      </div>

      {financials && thisMonth ? (
        <Panel title="Revenue">
          <div className="grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr] md:items-center">
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <div>
                <dt className="text-xs text-muted-foreground">{longMonth.format(thisMonth.monthStart)}</dt>
                <dd className="text-3xl font-bold text-brand-navy">{formatMoney(thisMonth.revenue)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Gross margin</dt>
                <dd
                  className={cn("text-lg font-semibold", thisMonth.margin.isNegative() && "text-destructive")}
                >
                  {formatMoney(thisMonth.margin)}
                  {margin ? (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      ({margin.toFixed(1)}%)
                    </span>
                  ) : null}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {thisMonth.loadCount} {thisMonth.loadCount === 1 ? "load" : "loads"} this month
                </dd>
              </div>
            </dl>
            <ColumnChart
              ariaLabel="Revenue per month, last 6 months"
              formatTick={(value) => compactMoney.format(value)}
              data={financials.map((month) => ({
                label: shortMonth.format(month.monthStart),
                // Bar height only: display geometry, never money arithmetic.
                value: month.revenue.toNumber(),
                valueLabel: compactMoney.format(month.revenue.toNumber()),
                tooltip: `${longMonth.format(month.monthStart)}: ${formatMoney(month.revenue)} revenue, ${formatMoney(month.margin)} margin`,
              }))}
            />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
