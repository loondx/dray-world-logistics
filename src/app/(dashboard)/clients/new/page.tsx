import type { Metadata } from "next";

import { ClientForm } from "@/components/clients/client-form";
import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage() {
  await requirePermission("masterdata:write");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <BackLink href="/clients">Clients</BackLink>
      <PageHeader title="New client" description="Only the company name is required." />
      <div className="rounded-lg border bg-card p-4 sm:p-5">
        <ClientForm />
      </div>
    </div>
  );
}
