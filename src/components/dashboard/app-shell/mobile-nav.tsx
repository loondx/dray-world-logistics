"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ allowedHrefs, companyName }: { allowedHrefs: string[]; companyName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-none bg-sidebar p-0 text-sidebar-foreground">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="border-b border-sidebar-border px-4 py-4">
          <BrandLockup name={companyName} tagline="Operations Portal" inverted />
        </div>
        <div className="px-2 py-4">
          <SidebarNav allowedHrefs={allowedHrefs} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
