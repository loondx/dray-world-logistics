"use client";

import { useRouter } from "next/navigation";

import { AddressFields } from "@/components/forms/address-fields";
import { TextAreaField, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import type { Carrier } from "@/generated/prisma/client";
import { createCarrierAction, updateCarrierAction, type SavedCarrier } from "@/features/carriers/actions";
import { toDateInputValue } from "@/lib/dates";

type CarrierDefaults = Partial<
  Pick<
    Carrier,
    | "legalName"
    | "dba"
    | "mcNumber"
    | "dotNumber"
    | "contactPerson"
    | "phone"
    | "email"
    | "addressLine1"
    | "city"
    | "stateProvince"
    | "postalCode"
    | "country"
    | "insuranceCompany"
    | "insurancePolicyNumber"
    | "insuranceExpiry"
    | "notes"
  >
>;

export function CarrierForm({
  carrierId,
  defaults,
  variant = "full",
  onSaved,
  onCancel,
}: {
  carrierId?: string;
  defaults?: CarrierDefaults;
  variant?: "full" | "quick";
  onSaved?: (carrier: SavedCarrier) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const action = carrierId ? updateCarrierAction.bind(null, carrierId) : createCarrierAction;
  const { pending, onSubmit, fieldError } = useActionForm(action, {
    onSuccess: onSaved ?? ((saved) => (carrierId ? router.refresh() : router.push(`/carriers/${saved.id}`))),
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-4">
        <TextField
          className="sm:col-span-2"
          label="Legal name"
          name="legalName"
          required
          autoFocus={variant === "quick"}
          defaultValue={defaults?.legalName ?? ""}
          error={fieldError("legalName")}
        />
        <TextField
          label="MC number"
          name="mcNumber"
          placeholder="MC123456"
          defaultValue={defaults?.mcNumber ?? ""}
          error={fieldError("mcNumber")}
        />
        <TextField
          label="DOT number"
          name="dotNumber"
          defaultValue={defaults?.dotNumber ?? ""}
          error={fieldError("dotNumber")}
        />
        <TextField
          className="sm:col-span-2"
          label="Dispatch contact"
          name="contactPerson"
          defaultValue={defaults?.contactPerson ?? ""}
          error={fieldError("contactPerson")}
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          defaultValue={defaults?.phone ?? ""}
          error={fieldError("phone")}
        />
        <TextField
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
          <div className="grid gap-3 sm:grid-cols-4">
            <TextField label="DBA" name="dba" defaultValue={defaults?.dba ?? ""} error={fieldError("dba")} />
            <TextField
              label="Insurance company"
              name="insuranceCompany"
              defaultValue={defaults?.insuranceCompany ?? ""}
              error={fieldError("insuranceCompany")}
            />
            <TextField
              label="Policy number"
              name="insurancePolicyNumber"
              defaultValue={defaults?.insurancePolicyNumber ?? ""}
              error={fieldError("insurancePolicyNumber")}
            />
            <TextField
              label="Insurance expiry"
              name="insuranceExpiry"
              type="date"
              defaultValue={toDateInputValue(defaults?.insuranceExpiry)}
              error={fieldError("insuranceExpiry")}
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
        <SubmitButton pending={pending}>{carrierId ? "Save changes" : "Save carrier"}</SubmitButton>
      </div>
    </form>
  );
}
