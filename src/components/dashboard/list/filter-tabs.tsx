import Link from "next/link";

import { cn } from "@/lib/utils";

import { buildHref, type SearchParamsRecord } from "./url";

// Segmented link control for a single URL filter (e.g. ?status=ARCHIVED).
export function FilterTabs({
  pathname,
  searchParams,
  param,
  options,
  value,
}: {
  pathname: string;
  searchParams: SearchParamsRecord;
  param: string;
  options: { value: string | null; label: string }[];
  value: string | null;
}) {
  return (
    <div role="group" aria-label="Filter" className="inline-flex rounded-md border bg-background p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Link
            key={option.label}
            href={buildHref(pathname, searchParams, { [param]: option.value, page: null })}
            aria-current={active ? "true" : undefined}
            scroll={false}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
