import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </header>
      <div className="grid gap-3 p-4">{children}</div>
    </section>
  );
}

// Responsive field grid: 1 column on phones, up to `cols` on wide screens.
export function FieldGrid({ cols = 4, children }: { cols?: 2 | 3 | 4 | 6; children: ReactNode }) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    6: "sm:grid-cols-3 lg:grid-cols-6",
  }[cols];
  return <div className={cn("grid gap-3", colClass)}>{children}</div>;
}
