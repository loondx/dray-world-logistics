import { Inbox, PhoneCall, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DescriptionList } from "@/components/dashboard/description-list";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AutoSubmitForm } from "@/components/dashboard/list/auto-submit-form";
import { FilterTabs } from "@/components/dashboard/list/filter-tabs";
import { Pagination } from "@/components/dashboard/list/pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { AddLeadDialog } from "@/components/quotes/add-lead-dialog";
import { QUOTE_STATUS_LABELS, QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuoteRequestStatus } from "@/generated/prisma/enums";
import { formatDateOnly, formatTimestamp } from "@/lib/dates";
import { can, requirePermission } from "@/server/auth/guards";
import { firstParam, parsePage } from "@/server/services/pagination";
import { listQuoteRequests } from "@/server/services/quote.service";

export const metadata: Metadata = { title: "Leads" };

// Opens the new-client form pre-filled from the lead.
function newClientHref(lead: {
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
}) {
  const params = new URLSearchParams({ companyName: lead.company || lead.name, contactName: lead.name });
  if (lead.email) params.set("email", lead.email);
  if (lead.phone) params.set("phone", lead.phone);
  return `/clients/new?${params.toString()}`;
}

export default async function QuotesPage({ searchParams }: PageProps<"/quotes">) {
  const user = await requirePermission("quotes:read");
  const params = await searchParams;
  const status = Object.values(QuoteRequestStatus).find((value) => value === firstParam(params.status));
  const q = firstParam(params.q)?.trim() || undefined;
  const result = await listQuoteRequests({ status, q, page: parsePage(params.page) });
  const canWrite = can(user, "quotes:write");
  const canCreateClient = can(user, "masterdata:write");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PageHeader
        title="Leads"
        description="Quote requests from the website arrive here automatically. Add phone and email enquiries with Add lead."
        actions={canWrite ? <AddLeadDialog /> : null}
      />
      <AutoSubmitForm className="flex gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name, company, email, phone or city"
          aria-label="Search leads"
          className="max-w-md bg-card"
        />
      </AutoSubmitForm>
      <FilterTabs
        pathname="/quotes"
        searchParams={params}
        param="status"
        value={status ?? null}
        options={[
          { value: null, label: "All" },
          ...Object.values(QuoteRequestStatus).map((value) => ({ value, label: QUOTE_STATUS_LABELS[value] })),
        ]}
      />
      <div className="rounded-lg border bg-card">
        {result.items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={q ? "No leads match your search" : "No leads yet"}
            description="Requests from the website's quote form appear here automatically."
          />
        ) : (
          <ul className="divide-y">
            {result.items.map((quote) => (
              <li key={quote.id} className="grid gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {quote.name}
                      {quote.company ? (
                        <span className="font-normal text-muted-foreground"> · {quote.company}</span>
                      ) : null}
                    </p>
                    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant={quote.source === "WEBSITE" ? "secondary" : "outline"}>
                        {quote.source === "WEBSITE" ? "Website" : "Added by staff"}
                      </Badge>
                      Received {formatTimestamp(quote.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canCreateClient ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={newClientHref(quote)}>
                          <UserPlus /> Create client
                        </Link>
                      </Button>
                    ) : null}
                    {quote.kind === "CALLBACK" ? (
                      <Badge variant="secondary" className="gap-1">
                        <PhoneCall className="size-3" aria-hidden="true" />
                        Call back
                      </Badge>
                    ) : null}
                    {canWrite ? (
                      <QuoteStatusSelect id={quote.id} status={quote.status} />
                    ) : (
                      <Badge variant="outline">{QUOTE_STATUS_LABELS[quote.status]}</Badge>
                    )}
                  </div>
                </div>
                {/* Every field the website form collects, each with its own label. */}
                <DescriptionList
                  columns={3}
                  items={[
                    {
                      label: "Email",
                      value: quote.email ? (
                        <a href={`mailto:${quote.email}`} className="text-brand-blue hover:underline">
                          {quote.email}
                        </a>
                      ) : null,
                    },
                    {
                      label: "Phone",
                      value: quote.phone ? (
                        <a href={`tel:${quote.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                          {quote.phone}
                        </a>
                      ) : null,
                    },
                    { label: "Service", value: quote.serviceType },
                    { label: "Pickup from", value: quote.origin },
                    { label: "Deliver to", value: quote.destination },
                    { label: "Equipment", value: quote.equipment },
                    { label: "Number of loads", value: quote.loadCount },
                    { label: "Ready date", value: quote.readyDate ? formatDateOnly(quote.readyDate) : null },
                    ...(quote.preferredTime
                      ? [{ label: "Preferred call time", value: quote.preferredTime }]
                      : []),
                    { label: "Notes", value: quote.message, wide: true },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <Pagination
        pathname="/quotes"
        searchParams={params}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
