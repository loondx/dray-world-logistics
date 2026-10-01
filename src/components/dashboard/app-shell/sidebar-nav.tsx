"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_SECTIONS } from "@/components/dashboard/nav-items";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// `allowedHrefs` is computed on the server from the user's permissions; the
// server still enforces access on every route.
export function SidebarNav({
  allowedHrefs,
  onNavigate,
}: {
  allowedHrefs: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAV_SECTIONS.map((section, index) => {
        const items = section.items.filter((item) => allowedHrefs.includes(item.href));
        if (items.length === 0) return null;
        return (
          <div key={section.title ?? index}>
            {section.title ? (
              <div className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50 uppercase">
                {section.title}
              </div>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--brand-blue)]"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
