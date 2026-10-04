import type { Metadata } from "next";

import { ClientForm } from "@/components/clients/client-form";
import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { requirePermission } from "@/server/auth/guards";

export const metadata: Metadata = { title: "New client" };

// Optional pre-fill from a lead: /clients/new?companyName=…&contactName=…&email=…&phone=…
export default async function NewClientPage({ searchParams }: PageProps<"/clients/new">) {
  await requirePermission("masterdata:write");
  const params = await searchParams;
  const value = (key: string) => {
    const raw = params[key];
    const text = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 200);
    return text || undefined;
  };
  const defaults = {
    companyName: value("companyName"),
    contactName: value("contactName"),
    email: value("email"),
    phone: value("phone"),
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <BackLink href="/clients">Clients</BackLink>
      <PageHeader title="New client" description="Only the company name is required." />
      <div className="rounded-lg border bg-card p-4 sm:p-5">
        <ClientForm defaults={defaults} />
      </div>
    </div>
  );
}
