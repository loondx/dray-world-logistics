import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { AttentionItem } from "@/server/services/dashboard.service";

// Exceptions to act on, most urgent first. Each item links to the matching list and to
// the first few loads directly, so the fix is one click away.
export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-800">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        All clear. Nothing needs attention right now.
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {items.map((item) => {
        const more = item.count - item.loads.length;
        return (
          <li key={item.id} className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2">
            <Link
              href={item.href}
              className="group flex items-start gap-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-foreground">
                  {item.title} <span className="text-amber-800">({item.count})</span>
                </span>
                <span className="block text-xs text-muted-foreground">{item.detail}</span>
              </span>
              <ChevronRight
                className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                aria-hidden="true"
              />
            </Link>
            {item.loads.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pl-6 text-xs">
                {item.loads.map((load) => (
                  <Link
                    key={load.id}
                    href={`/loads/${load.id}`}
                    className="rounded border bg-card px-1.5 py-0.5 font-semibold text-brand-navy hover:border-brand-blue"
                  >
                    #{load.loadNumber}
                  </Link>
                ))}
                {more > 0 ? <span className="text-muted-foreground">+{more} more</span> : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
