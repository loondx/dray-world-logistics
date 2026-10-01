import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { buildHref, type SearchParamsRecord } from "./url";

export function Pagination({
  pathname,
  searchParams,
  page,
  pageSize,
  total,
}: {
  pathname: string;
  searchParams: SearchParamsRecord;
  page: number;
  pageSize: number;
  total: number;
}) {
  if (total === 0) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <PageLink
          disabled={page <= 1}
          href={buildHref(pathname, searchParams, { page: page - 1 > 1 ? String(page - 1) : null })}
          label="Previous page"
        >
          <ChevronLeft />
        </PageLink>
        <span className="px-2 text-muted-foreground tabular-nums">
          {page} / {pageCount}
        </span>
        <PageLink
          disabled={page >= pageCount}
          href={buildHref(pathname, searchParams, { page: String(page + 1) })}
          label="Next page"
        >
          <ChevronRight />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  disabled,
  href,
  label,
  children,
}: {
  disabled: boolean;
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="icon-sm" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="icon-sm">
      <Link href={href} aria-label={label} scroll={false}>
        {children}
      </Link>
    </Button>
  );
}
