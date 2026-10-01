"use client";

import { useState } from "react";

import { Combobox, type ComboboxOption } from "@/components/forms/combobox";
import { Field, TextAreaField, TextField } from "@/components/forms/field";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import type { Driver } from "@/generated/prisma/client";
import { createDriverAction, updateDriverAction, type SavedDriver } from "@/features/drivers/actions";

type DriverDefaults = Partial<
  Pick<Driver, "firstName" | "lastName" | "phone" | "email" | "truckNumber" | "trailerNumber" | "notes">
>;

// Either `carrierId` is fixed (carrier page, load form) or the user picks one from `carrierOptions`.
export function DriverForm({
  driverId,
  carrierId,
  carrierOptions,
  defaults,
  showNotes = true,
  onSaved,
  onCancel,
}: {
  driverId?: string;
  carrierId?: string;
  carrierOptions?: ComboboxOption[];
  defaults?: DriverDefaults;
  showNotes?: boolean;
  onSaved: (driver: SavedDriver) => void;
  onCancel?: () => void;
}) {
  const [selectedCarrier, setSelectedCarrier] = useState(carrierId ?? "");
  const action = driverId ? updateDriverAction.bind(null, driverId) : createDriverAction;
  const { pending, onSubmit, fieldError } = useActionForm(action, { onSuccess: onSaved });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {carrierId ? (
        <input type="hidden" name="carrierId" value={carrierId} />
      ) : (
        <Field label="Carrier" required error={fieldError("carrierId")}>
          {(props) => (
            <Combobox
              id={props.id}
              invalid={props["aria-invalid"]}
              describedBy={props["aria-describedby"]}
              name="carrierId"
              options={carrierOptions ?? []}
              value={selectedCarrier}
              onChange={setSelectedCarrier}
              placeholder="Select carrier"
            />
          )}
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          required
          autoFocus
          defaultValue={defaults?.firstName ?? ""}
          error={fieldError("firstName")}
        />
        <TextField
          label="Last name"
          name="lastName"
          defaultValue={defaults?.lastName ?? ""}
          error={fieldError("lastName")}
        />
        <TextField
          label="Cell phone"
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
        <TextField
          label="Truck #"
          name="truckNumber"
          defaultValue={defaults?.truckNumber ?? ""}
          error={fieldError("truckNumber")}
        />
        <TextField
          label="Trailer / chassis #"
          name="trailerNumber"
          defaultValue={defaults?.trailerNumber ?? ""}
          error={fieldError("trailerNumber")}
        />
      </div>
      {showNotes ? (
        <TextAreaField
          label="Notes"
          name="notes"
          rows={2}
          defaultValue={defaults?.notes ?? ""}
          error={fieldError("notes")}
        />
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        <SubmitButton pending={pending}>{driverId ? "Save changes" : "Save driver"}</SubmitButton>
      </div>
    </form>
  );
}
