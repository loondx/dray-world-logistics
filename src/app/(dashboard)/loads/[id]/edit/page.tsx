import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/dashboard/back-link";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadForm } from "@/components/loads/load-form/load-form";
import { LOAD_TYPE_LABELS } from "@/features/loads/equipment";
import { toLoadFormValues } from "@/features/loads/form-values";
import { can, requirePermission } from "@/server/auth/guards";
import { getCarrierOption, listCarrierOptions, type CarrierOption } from "@/server/services/carrier.service";
import { getClientOption, listClientOptions, type ClientOption } from "@/server/services/client.service";
import { getLoadForEdit, listSavedLocations } from "@/server/services/load.queries";

export const metadata: Metadata = { title: "Edit load" };

// Archived records already on this load stay selectable while editing it.
async function withCurrentParties(
  clients: ClientOption[],
  carriers: CarrierOption[],
  clientId: string,
  carrierId: string | null,
) {
  const extraClient = clients.some((c) => c.id === clientId) ? null : await getClientOption(clientId);
  const extraCarrier =
    !carrierId || carriers.some((c) => c.id === carrierId) ? null : await getCarrierOption(carrierId);
  return {
    clients: extraClient ? [extraClient, ...clients] : clients,
    carriers: extraCarrier ? [extraCarrier, ...carriers] : carriers,
  };
}

export default async function EditLoadPage({ params }: PageProps<"/loads/[id]/edit">) {
  const user = await requirePermission("loads:write");
  const { id } = await params;
  const load = await getLoadForEdit(id);
  if (!load) notFound();

  const [clients, carriers, savedLocations] = await Promise.all([
    listClientOptions(),
    listCarrierOptions(),
    listSavedLocations(),
  ]);
  const options = await withCurrentParties(clients, carriers, load.clientId, load.carrierId);
  const canEditRates = can(user, "financials:write");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <BackLink href={`/loads/${load.id}`}>Load #{load.loadNumber}</BackLink>
      <PageHeader
        title={`Edit load #${load.loadNumber}`}
        description={`${LOAD_TYPE_LABELS[load.type]} load`}
      />
      <LoadForm
        type={load.type}
        loadId={load.id}
        defaults={toLoadFormValues(load, canEditRates)}
        clients={options.clients}
        carriers={options.carriers}
        savedLocations={savedLocations}
        canEditRates={canEditRates}
        canCreateMasterData={can(user, "masterdata:write")}
      />
    </div>
  );
}
