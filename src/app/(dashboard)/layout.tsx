import type { Metadata } from "next";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand/brand-mark";
import { MobileNav } from "@/components/dashboard/app-shell/mobile-nav";
import { SidebarNav } from "@/components/dashboard/app-shell/sidebar-nav";
import { UserMenu } from "@/components/dashboard/app-shell/user-menu";
import { NAV_SECTIONS } from "@/components/dashboard/nav-items";
import { ROLE_LABELS } from "@/lib/labels/user-role";
import { can, requireUser } from "@/server/auth/guards";
import { getCompanySettings } from "@/server/services/company-settings.service";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Server-side authentication for every internal page (the proxy is only an optimistic pre-check).
  const user = await requireUser();
  const company = await getCompanySettings();

  const allowedHrefs = NAV_SECTIONS.flatMap((section) => section.items)
    .filter((item) => can(user, item.permission))
    .map((item) => item.href);

  return (
    <div className="flex min-h-svh flex-1 bg-muted/50">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border px-4 py-4">
          <BrandLockup name={company.displayName} tagline="Operations Portal" inverted />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <SidebarNav allowedHrefs={allowedHrefs} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
          <MobileNav allowedHrefs={allowedHrefs} companyName={company.displayName} />
          <div className="flex-1" />
          <UserMenu name={user.name} email={user.email} roleLabel={ROLE_LABELS[user.role]} />
        </header>
        <main id="main" className="flex-1 px-4 py-5 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
