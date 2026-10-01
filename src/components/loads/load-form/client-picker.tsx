"use client";

import { useState } from "react";

import { ClientForm } from "@/components/clients/client-form";
import { Combobox } from "@/components/forms/combobox";
import { Field } from "@/components/forms/field";
import { QuickCreateDialog } from "@/components/forms/quick-create-dialog";
import { formatCityState } from "@/lib/labels/people";
import type { ClientOption } from "@/server/services/client.service";

export function ClientPicker({
  initialClients,
  defaultClientId,
  error,
  canCreate,
}: {
  initialClients: ClientOption[];
  defaultClientId: string;
  error?: string;
  canCreate: boolean;
}) {
  const [clients, setClients] = useState(initialClients);
  const [clientId, setClientId] = useState(defaultClientId);
  const [creating, setCreating] = useState<string | null>(null);

  return (
    <>
      <Field label="Client" required error={error}>
        {(props) => (
          <Combobox
            id={props.id}
            invalid={props["aria-invalid"]}
            describedBy={props["aria-describedby"]}
            name="clientId"
            options={clients.map((client) => ({
              value: client.id,
              label: client.companyName,
              description: formatCityState(client.city, client.stateProvince) || undefined,
            }))}
            value={clientId}
            onChange={setClientId}
            placeholder="Search clients…"
            searchPlaceholder="Type a company name…"
            emptyText="No client found."
            createLabel="New client"
            onCreate={canCreate ? (search) => setCreating(search) : undefined}
          />
        )}
      </Field>
      <QuickCreateDialog
        open={creating !== null}
        onOpenChange={(open) => !open && setCreating(null)}
        title="New client"
        description="Saved to your client list for future loads."
      >
        <ClientForm
          key={creating ?? ""}
          variant="quick"
          defaults={{ companyName: creating ?? "" }}
          onCancel={() => setCreating(null)}
          onSaved={(saved) => {
            setClients((current) =>
              [
                ...current,
                { id: saved.id, companyName: saved.companyName, city: null, stateProvince: null },
              ].sort((a, b) => a.companyName.localeCompare(b.companyName)),
            );
            setClientId(saved.id);
            setCreating(null);
          }}
        />
      </QuickCreateDialog>
    </>
  );
}
