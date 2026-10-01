import { Inbox, PhoneCall } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/dashboard/empty-state";
import { FilterTabs } from "@/components/dashboard/list/filter-tabs";
import { Pagination } from "@/components/dashboard/list/pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { QUOTE_STATUS_LABELS, QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuoteRequestStatus } from "@/generated/prisma/enums";
import { formatDateOnlyShort, formatTimestamp } from "@/lib/dates";
import { can, requirePermission } from "@/server/auth/guards";
import { firstParam, parsePage } from "@/server/services/pagination";
import { listQuoteRequests } from "@/server/services/quote.service";

export const metadata: Metadata = { title: "Quote requests" };

export default async function QuotesPage({ searchParams }: PageProps<"/quotes">) {
  const user = await requirePermission("quotes:read");
  const params = await searchParams;
  const status = Object.values(QuoteRequestStatus).find((value) => value === firstParam(params.status));
  const result = await listQuoteRequests({ status, page: parsePage(params.page) });
  const canWrite = can(user, "quotes:write");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PageHeader
        title="Quote requests"
        description="Leads from the website: quote requests and call-back requests."
      />
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
      <div className="overflow-x-auto rounded-lg border bg-card">
        {result.items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No quote requests"
            description="Requests from the website's quote form appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Lane</TableHead>
                <TableHead className="min-w-64">Details</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((quote) => (
                <TableRow key={quote.id} className="align-top">
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatTimestamp(quote.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{quote.name}</div>
                    {quote.company ? (
                      <div className="text-xs text-muted-foreground">{quote.company}</div>
                    ) : null}
                    {quote.email ? (
                      <a
                        href={`mailto:${quote.email}`}
                        className="block text-xs text-brand-blue hover:underline"
                      >
                        {quote.email}
                      </a>
                    ) : null}
                    {quote.phone ? (
                      <a
                        href={`tel:${quote.phone.replace(/[^\d+]/g, "")}`}
                        className="block text-xs hover:underline"
                      >
                        {quote.phone}
                      </a>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">
                    {quote.kind === "CALLBACK" ? (
                      <Badge variant="secondary" className="gap-1">
                        <PhoneCall className="size-3" aria-hidden="true" />
                        Call back
                      </Badge>
                    ) : (
                      quote.serviceType
                    )}
                    {quote.preferredTime ? (
                      <div className="mt-1 text-xs text-muted-foreground">{quote.preferredTime}</div>
                    ) : null}
                    {quote.equipment || quote.loadCount || quote.readyDate ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {[
                          quote.equipment,
                          quote.loadCount
                            ? `${quote.loadCount} load${quote.loadCount === 1 ? "" : "s"}`
                            : null,
                          quote.readyDate ? `Ready ${formatDateOnlyShort(quote.readyDate)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">
                    {[quote.origin, quote.destination].filter(Boolean).join(" → ") || "—"}
                  </TableCell>
                  <TableCell className="max-w-md text-sm whitespace-pre-line">
                    {quote.message ?? "—"}
                  </TableCell>
                  <TableCell>
                    {canWrite ? (
                      <QuoteStatusSelect id={quote.id} status={quote.status} />
                    ) : (
                      QUOTE_STATUS_LABELS[quote.status]
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
