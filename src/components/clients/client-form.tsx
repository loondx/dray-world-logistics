"use client";

import { useRouter } from "next/navigation";

import { AddressFields } from "@/components/forms/address-fields";
import { TextAreaField, TextField } from "@/components/forms/field";
import { PaymentTermsField } from "@/components/forms/payment-terms-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import type { Client } from "@/generated/prisma/client";
import { createClientAction, updateClientAction, type SavedClient } from "@/features/clients/actions";

type ClientDefaults = Partial<
  Pick<
    Client,
    | "companyName"
    | "contactName"
    | "email"
    | "phone"
    | "addressLine1"
    | "city"
    | "stateProvince"
    | "postalCode"
    | "country"
    | "mcNumber"
    | "dotNumber"
    | "paymentTermsDays"
    | "notes"
  >
>;

// `quick` shows only the essentials (used in the load form's "New client" dialog).
export function ClientForm({
  clientId,
  defaults,
  variant = "full",
  onSaved,
  onCancel,
}: {
  clientId?: string;
  defaults?: ClientDefaults;
  variant?: "full" | "quick";
  onSaved?: (client: SavedClient) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const action = clientId ? updateClientAction.bind(null, clientId) : createClientAction;
  const { pending, onSubmit, fieldError } = useActionForm(action, {
    // Standalone pages: open the new record, or refresh after an edit.
    onSuccess: onSaved ?? ((saved) => (clientId ? router.refresh() : router.push(`/clients/${saved.id}`))),
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          className="sm:col-span-2"
          label="Company name"
          name="companyName"
          required
          autoFocus={variant === "quick"}
          defaultValue={defaults?.companyName ?? ""}
          error={fieldError("companyName")}
        />
        <TextField
          label="Contact name"
          name="contactName"
          defaultValue={defaults?.contactName ?? ""}
          error={fieldError("contactName")}
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          defaultValue={defaults?.phone ?? ""}
          error={fieldError("phone")}
        />
        <TextField
          className="sm:col-span-2"
          label="Email"
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ""}
          error={fieldError("email")}
        />
      </div>

      <AddressFields defaults={defaults} fieldError={fieldError} />

      {variant === "full" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="MC number"
              name="mcNumber"
              hint="Only if the client is a broker/carrier."
              defaultValue={defaults?.mcNumber ?? ""}
              error={fieldError("mcNumber")}
            />
            <TextField
              label="DOT number"
              name="dotNumber"
              defaultValue={defaults?.dotNumber ?? ""}
              error={fieldError("dotNumber")}
            />
            <PaymentTermsField
              name="paymentTermsDays"
              label="Payment terms"
              emptyLabel="Company default"
              hint="Printed on this client's invoices."
              defaultValue={defaults?.paymentTermsDays}
              error={fieldError("paymentTermsDays")}
            />
          </div>
          <TextAreaField
            label="Notes"
            name="notes"
            hint="Internal only. Never printed on documents."
            defaultValue={defaults?.notes ?? ""}
            error={fieldError("notes")}
          />
        </>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <SubmitButton pending={pending}>{clientId ? "Save changes" : "Save client"}</SubmitButton>
      </div>
    </form>
  );
}
