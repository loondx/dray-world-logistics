import { Archive, ArchiveRestore, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientForm } from "@/components/clients/client-form";
import { BackLink } from "@/components/dashboard/back-link";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import { Panel } from "@/components/dashboard/description-list";
import { PageHeader } from "@/components/dashboard/page-header";
import { LoadTable } from "@/components/loads/load-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setClientArchivedAction } from "@/features/clients/actions";
import { can, requirePermission } from "@/server/auth/guards";
import { getClient } from "@/server/services/client.service";
import { listRecentLoads } from "@/server/services/load.queries";

export const metadata: Metadata = { title: "Client" };

export default async function ClientDetailPage({ params }: PageProps<"/clients/[id]">) {
  const user = await requirePermission("masterdata:read");
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const loads = await listRecentLoads({ clientId: id }, 15);
  const canWrite = can(user, "masterdata:write");
  const archived = client.status === "ARCHIVED";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <BackLink href="/clients">Clients</BackLink>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {client.companyName}
            {archived ? <Badge variant="secondary">Archived</Badge> : null}
          </span>
        }
        description={
          [client.contactName, client.phone, client.email].filter(Boolean).join(" · ") || undefined
        }
        actions={
          <>
            {!archived && can(user, "loads:write") ? (
              <Button asChild size="sm">
                <Link href={`/loads/new?client=${client.id}`}>
                  <Plus /> New load
                </Link>
              </Button>
            ) : null}
            {canWrite ? (
              <ConfirmActionButton
                action={setClientArchivedAction.bind(null, client.id, !archived)}
                title={archived ? "Restore client?" : "Archive client?"}
                description={
                  archived
                    ? "The client will be available again when creating loads."
                    : "Archived clients are hidden from new loads. Existing loads and documents are kept."
                }
                confirmLabel={archived ? "Restore" : "Archive"}
              >
                {archived ? <ArchiveRestore /> : <Archive />}
                {archived ? "Restore" : "Archive"}
              </ConfirmActionButton>
            ) : null}
          </>
        }
      />

      <Panel
        title={`Loads (${loads.length}${loads.length === 15 ? "+" : ""})`}
        actions={
          <Button asChild size="xs" variant="ghost">
            <Link href={`/loads?client=${client.id}`}>View all</Link>
          </Button>
        }
      >
        {loads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No loads for this client yet.</p>
        ) : (
          <div className="-m-4 overflow-x-auto">
            <LoadTable loads={loads} showFinancials={can(user, "financials:read")} compact />
          </div>
        )}
      </Panel>

      <Panel title={canWrite ? "Edit client" : "Client details"}>
        {canWrite ? (
          <ClientForm clientId={client.id} defaults={client} />
        ) : (
          <p className="text-sm whitespace-pre-line">
            {[
              client.addressLine1,
              [client.city, client.stateProvince, client.postalCode].filter(Boolean).join(" "),
              client.country,
            ]
              .filter(Boolean)
              .join("\n") || "No address on file."}
          </p>
        )}
      </Panel>
    </div>
  );
}
