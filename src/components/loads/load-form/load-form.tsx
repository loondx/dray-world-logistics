"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field, TextAreaField, TextField } from "@/components/forms/field";
import { FormSection } from "@/components/forms/form-section";
import { NativeSelect } from "@/components/forms/native-select";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import type { LoadType } from "@/generated/prisma/enums";
import { createLoadAction, updateLoadAction, type SavedLoad } from "@/features/loads/actions";
import { DIRECTION_LABELS, EQUIPMENT_OPTIONS, LOAD_TYPE_LABELS } from "@/features/loads/equipment";
import type { LoadFormValues } from "@/features/loads/form-values";
import type { CarrierOption } from "@/server/services/carrier.service";
import type { ClientOption } from "@/server/services/client.service";
import type { SavedLocation } from "@/server/services/load.queries";

import { LoadCreatedPanel } from "../load-created-panel";
import { CarrierSection } from "./carrier-section";
import { ClientPicker } from "./client-picker";
import { RatesSection } from "./rates-section";
import { StopSection } from "./stop-section";

export function LoadForm({
  type,
  loadId,
  defaults,
  clients,
  carriers,
  savedLocations,
  canEditRates,
  canCreateMasterData,
}: {
  type: LoadType;
  loadId?: string;
  defaults: LoadFormValues;
  clients: ClientOption[];
  carriers: CarrierOption[];
  savedLocations: SavedLocation[];
  canEditRates: boolean;
  canCreateMasterData: boolean;
}) {
  const router = useRouter();
  const [created, setCreated] = useState<SavedLoad | null>(null);
  const action = loadId ? updateLoadAction.bind(null, loadId) : createLoadAction;
  const { pending, onSubmit, fieldError } = useActionForm(action, {
    onSuccess: (saved) => {
      if (loadId) {
        router.push(`/loads/${saved.id}`);
        router.refresh();
      } else {
        setCreated(saved);
        window.scrollTo({ top: 0 });
      }
    },
  });

  if (created) {
    return (
      <LoadCreatedPanel
        load={created}
        // Unmounting the form on success means "Create another" starts from a clean slate.
        onCreateAnother={() => setCreated(null)}
      />
    );
  }

  const equipment = EQUIPMENT_OPTIONS[type];
  const isDrayage = type === "DRAYAGE";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 lg:grid-cols-3">
      <input type="hidden" name="type" value={type} />

      <div className="grid content-start gap-4 lg:col-span-2">
        <FormSection title={`${LOAD_TYPE_LABELS[type]} load`}>
          <div className="grid gap-3 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <ClientPicker
                initialClients={clients}
                defaultClientId={defaults.clientId}
                error={fieldError("clientId")}
                canCreate={canCreateMasterData}
              />
            </div>
            <TextField
              className="sm:col-span-2"
              label="Load date"
              name="loadDate"
              type="date"
              required
              defaultValue={defaults.loadDate}
              error={fieldError("loadDate")}
            />
            {isDrayage ? (
              <TextField
                className="sm:col-span-2"
                label="Container #"
                name="containerNumber"
                placeholder="ABCD1234567"
                defaultValue={defaults.containerNumber}
                error={fieldError("containerNumber")}
                autoComplete="off"
              />
            ) : null}
            <TextField
              className="sm:col-span-2"
              label={isDrayage ? "Client ref #" : "Client ref / PO #"}
              name="customerReference"
              defaultValue={defaults.customerReference}
              error={fieldError("customerReference")}
            />
            {isDrayage ? (
              <TextField
                className="sm:col-span-2"
                label="Booking / B/L #"
                name="bookingNumber"
                defaultValue={defaults.bookingNumber}
                error={fieldError("bookingNumber")}
              />
            ) : null}
            <Field label="Equipment" className="sm:col-span-2">
              {(props) => (
                <NativeSelect {...props} name="equipmentType" defaultValue={defaults.equipmentType}>
                  <option value="">-</option>
                  {equipment.types.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <Field label={isDrayage ? "Size" : "Length"} className="sm:col-span-1">
              {(props) => (
                <NativeSelect {...props} name="equipmentSize" defaultValue={defaults.equipmentSize}>
                  <option value="">-</option>
                  {equipment.sizes.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            {isDrayage ? (
              <Field label="Import / Export" className="sm:col-span-1">
                {(props) => (
                  <NativeSelect {...props} name="direction" defaultValue={defaults.direction}>
                    <option value="">-</option>
                    {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            ) : null}
            <TextField
              className={isDrayage ? "sm:col-span-2" : "sm:col-span-3"}
              label="Seal #"
              name="sealNumber"
              defaultValue={defaults.sealNumber}
              error={fieldError("sealNumber")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-6">
            <TextField
              className="sm:col-span-3"
              label="Commodity"
              name="commodity"
              placeholder="e.g. Furniture, General merchandise"
              defaultValue={defaults.commodity}
              error={fieldError("commodity")}
            />
            <TextField
              className="sm:col-span-1"
              label="Weight"
              name="weight"
              inputMode="decimal"
              defaultValue={defaults.weight}
              error={fieldError("weight")}
            />
            <Field label="Unit" className="sm:col-span-1">
              {(props) => (
                <NativeSelect {...props} name="weightUnit" defaultValue={defaults.weightUnit || "LB"}>
                  <option value="LB">lbs</option>
                  <option value="KG">kg</option>
                </NativeSelect>
              )}
            </Field>
            <TextField
              className="sm:col-span-1"
              label="Pieces"
              name="pieces"
              inputMode="numeric"
              defaultValue={defaults.pieces}
              error={fieldError("pieces")}
            />
          </div>
        </FormSection>

        <StopSection
          prefix="pickup"
          title="Pickup"
          defaults={defaults.pickup}
          savedLocations={savedLocations}
          fieldError={fieldError}
        />
        <StopSection
          prefix="delivery"
          title="Delivery"
          defaults={defaults.delivery}
          savedLocations={savedLocations}
          fieldError={fieldError}
        />
      </div>

      <div className="grid content-start gap-4">
        <CarrierSection
          initialCarriers={carriers}
          defaults={defaults}
          fieldError={fieldError}
          canCreate={canCreateMasterData}
        />
        {canEditRates ? <RatesSection defaults={defaults} fieldError={fieldError} /> : null}
        <FormSection title="Notes">
          <TextAreaField
            label="Special instructions"
            name="specialInstructions"
            hint="Printed on the carrier confirmation, client confirmation and BOL."
            defaultValue={defaults.specialInstructions}
            error={fieldError("specialInstructions")}
          />
          <TextAreaField
            label="Internal notes"
            name="internalNotes"
            hint="Staff only. Never printed."
            defaultValue={defaults.internalNotes}
            error={fieldError("internalNotes")}
          />
        </FormSection>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur lg:col-span-3 lg:-mx-6 lg:px-6">
        <Button asChild variant="outline">
          <Link href={loadId ? `/loads/${loadId}` : "/loads"}>Cancel</Link>
        </Button>
        <SubmitButton pending={pending} pendingLabel={loadId ? "Saving…" : "Creating load…"} size="lg">
          {loadId ? "Save changes" : "Create load"}
        </SubmitButton>
      </div>
    </form>
  );
}
