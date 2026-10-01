import type { Metadata } from "next";

import { CarrierForm } from "@/components/carriers/carrier-form";
import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = { title: "New carrier" };

export default async function NewCarrierPage() {
  await requirePermission("masterdata:write");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <BackLink href="/carriers">Carriers</BackLink>
      <PageHeader
        title="New carrier"
        description="Only the legal name is required. Add drivers after saving."
      />
      <div className="rounded-lg border bg-card p-4 sm:p-5">
        <CarrierForm />
      </div>
    </div>
  );
}
