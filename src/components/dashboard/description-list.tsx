import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DescriptionItem = { label: string; value: ReactNode; wide?: boolean };

// Compact label/value grid; empty values render as an em dash.
export function DescriptionList({ items, columns = 2 }: { items: DescriptionItem[]; columns?: 1 | 2 | 3 }) {
  return (
    <dl
      className={cn(
        "grid gap-x-4 gap-y-2.5 text-sm",
        columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn("min-w-0", item.wide && "sm:col-span-full")}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="font-medium break-words whitespace-pre-line">
            {item.value === null || item.value === undefined || item.value === "" ? (
              <span className="font-normal text-muted-foreground">—</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Panel({
  title,
  actions,
  id,
  className,
  children,
}: {
  title: string;
  actions?: ReactNode;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 rounded-lg border bg-card", className)}>
      <header className="flex min-h-11 items-center justify-between gap-2 border-b px-4 py-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {actions ? <div className="flex flex-wrap items-center gap-1.5">{actions}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
