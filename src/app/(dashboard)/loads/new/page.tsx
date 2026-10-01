import { Container, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadForm } from "@/components/loads/load-form/load-form";
import { LoadType } from "@/generated/prisma/enums";
import { LOAD_TYPE_DESCRIPTIONS, LOAD_TYPE_LABELS } from "@/features/loads/equipment";
import { emptyLoadFormValues } from "@/features/loads/form-values";
import { toDateInputValue, todayDateOnly } from "@/lib/dates";
import { can, requirePermission } from "@/server/auth/guards";
import { listCarrierOptions } from "@/server/services/carrier.service";
import { listClientOptions } from "@/server/services/client.service";
import { listSavedLocations } from "@/server/services/load.queries";
import { firstParam } from "@/server/services/pagination";

export const metadata: Metadata = { title: "New load" };

const TYPE_ICONS = { DRAYAGE: Container, OTR: Truck } as const;

function parseType(value: string | undefined): LoadType | null {
  return value === LoadType.DRAYAGE || value === LoadType.OTR ? value : null;
}

export default async function NewLoadPage({ searchParams }: PageProps<"/loads/new">) {
  const user = await requirePermission("loads:write");
  const params = await searchParams;
  const type = parseType(firstParam(params.type));
  const preselectedClient = firstParam(params.client);

  if (!type) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <BackLink href="/loads">Loads</BackLink>
        <PageHeader title="Create load" description="What type of load?" />
        <div className="grid gap-3 sm:grid-cols-2">
          {([LoadType.DRAYAGE, LoadType.OTR] as const).map((option) => {
            const Icon = TYPE_ICONS[option];
            return (
              <Link
                key={option}
                href={`/loads/new?type=${option}${preselectedClient ? `&client=${encodeURIComponent(preselectedClient)}` : ""}`}
                className="group flex items-start gap-3 rounded-lg border bg-card p-5 transition-colors outline-none hover:border-brand-blue focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-brand-navy group-hover:bg-brand-navy group-hover:text-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold">{LOAD_TYPE_LABELS[option]}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {LOAD_TYPE_DESCRIPTIONS[option]}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const [clients, carriers, savedLocations] = await Promise.all([
    listClientOptions(),
    listCarrierOptions(),
    listSavedLocations(),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <BackLink href="/loads/new">Change load type</BackLink>
      <PageHeader
        title={`New ${LOAD_TYPE_LABELS[type]} load`}
        description="Only the client and load date are required — fill in the rest as you know it."
      />
      <LoadForm
        type={type}
        defaults={{
          ...emptyLoadFormValues(toDateInputValue(todayDateOnly())),
          // Only pre-select a client that is actually selectable.
          clientId: clients.some((client) => client.id === preselectedClient)
            ? (preselectedClient ?? "")
            : "",
        }}
        clients={clients}
        carriers={carriers}
        savedLocations={savedLocations}
        canEditRates={can(user, "financials:write")}
        canCreateMasterData={can(user, "masterdata:write")}
      />
    </div>
  );
}
