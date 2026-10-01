"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { CarrierForm } from "@/components/carriers/carrier-form";
import { DriverForm } from "@/components/drivers/driver-form";
import { Combobox } from "@/components/forms/combobox";
import { Field, TextField } from "@/components/forms/field";
import { FormSection } from "@/components/forms/form-section";
import { NativeSelect } from "@/components/forms/native-select";
import { QuickCreateDialog } from "@/components/forms/quick-create-dialog";
import { Button } from "@/components/ui/button";
import { driverFullName } from "@/lib/labels/people";
import type { CarrierOption } from "@/server/services/carrier.service";

export function CarrierSection({
  initialCarriers,
  defaults,
  fieldError,
  canCreate,
}: {
  initialCarriers: CarrierOption[];
  defaults: {
    carrierId: string;
    driverId: string;
    truckNumber: string;
    trailerNumber: string;
    miles: string;
  };
  fieldError: (name: string) => string | undefined;
  canCreate: boolean;
}) {
  const [carriers, setCarriers] = useState(initialCarriers);
  const [carrierId, setCarrierId] = useState(defaults.carrierId);
  const [driverId, setDriverId] = useState(defaults.driverId);
  const [truckNumber, setTruckNumber] = useState(defaults.truckNumber);
  const [trailerNumber, setTrailerNumber] = useState(defaults.trailerNumber);
  const [dialog, setDialog] = useState<"carrier" | "driver" | null>(null);
  const [newCarrierName, setNewCarrierName] = useState("");

  const carrier = carriers.find((c) => c.id === carrierId);
  const drivers = carrier?.drivers ?? [];

  function selectCarrier(id: string) {
    setCarrierId(id);
    setDriverId("");
  }

  function selectDriver(id: string) {
    setDriverId(id);
    const driver = drivers.find((d) => d.id === id);
    // Pre-fill equipment from the driver's profile; staff can still override per load.
    if (driver?.truckNumber) setTruckNumber(driver.truckNumber);
    if (driver?.trailerNumber) setTrailerNumber(driver.trailerNumber);
  }

  return (
    <FormSection title="Carrier & driver">
      <Field
        label="Carrier"
        error={fieldError("carrierId")}
        hint={carrier?.mcNumber ? `MC ${carrier.mcNumber}` : undefined}
      >
        {(props) => (
          <Combobox
            id={props.id}
            invalid={props["aria-invalid"]}
            describedBy={props["aria-describedby"]}
            name="carrierId"
            options={carriers.map((c) => ({
              value: c.id,
              label: c.legalName,
              description: c.mcNumber ? `MC ${c.mcNumber}` : undefined,
              keywords: c.mcNumber ? [c.mcNumber] : undefined,
            }))}
            value={carrierId}
            onChange={selectCarrier}
            placeholder="Select carrier (optional)"
            searchPlaceholder="Search name or MC #…"
            createLabel="New carrier"
            onCreate={
              canCreate
                ? (search) => {
                    setNewCarrierName(search);
                    setDialog("carrier");
                  }
                : undefined
            }
          />
        )}
      </Field>

      <div className="grid gap-1.5">
        <Field label="Driver" error={fieldError("driverId")}>
          {(props) => (
            <NativeSelect
              {...props}
              name="driverId"
              value={driverId}
              onChange={(event) => selectDriver(event.target.value)}
              disabled={!carrierId}
            >
              <option value="">{carrierId ? "Driver not set" : "Select a carrier first"}</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driverFullName(driver)}
                  {driver.phone ? ` · ${driver.phone}` : ""}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        {carrierId && canCreate ? (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="w-fit px-0"
            onClick={() => setDialog("driver")}
          >
            <Plus /> Add driver to this carrier
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Truck #"
          name="truckNumber"
          value={truckNumber}
          onChange={(event) => setTruckNumber(event.target.value)}
          error={fieldError("truckNumber")}
        />
        <TextField
          label="Trailer / chassis #"
          name="trailerNumber"
          value={trailerNumber}
          onChange={(event) => setTrailerNumber(event.target.value)}
          error={fieldError("trailerNumber")}
        />
      </div>
      <TextField
        label="Miles"
        name="miles"
        inputMode="numeric"
        defaultValue={defaults.miles}
        error={fieldError("miles")}
      />

      <QuickCreateDialog
        open={dialog === "carrier"}
        onOpenChange={(open) => setDialog(open ? "carrier" : null)}
        title="New carrier"
        description="Only the legal name is required. You can complete the profile later."
      >
        <CarrierForm
          key={newCarrierName}
          variant="quick"
          defaults={{ legalName: newCarrierName }}
          onCancel={() => setDialog(null)}
          onSaved={(saved) => {
            setCarriers((current) =>
              [
                ...current,
                { id: saved.id, legalName: saved.legalName, mcNumber: saved.mcNumber, drivers: [] },
              ].sort((a, b) => a.legalName.localeCompare(b.legalName)),
            );
            selectCarrier(saved.id);
            setDialog(null);
          }}
        />
      </QuickCreateDialog>

      <QuickCreateDialog
        open={dialog === "driver"}
        onOpenChange={(open) => setDialog(open ? "driver" : null)}
        title={`New driver${carrier ? ` — ${carrier.legalName}` : ""}`}
      >
        {carrierId ? (
          <DriverForm
            carrierId={carrierId}
            showNotes={false}
            onCancel={() => setDialog(null)}
            onSaved={(saved) => {
              setCarriers((current) =>
                current.map((c) => (c.id === saved.carrierId ? { ...c, drivers: [...c.drivers, saved] } : c)),
              );
              setDriverId(saved.id);
              if (saved.truckNumber) setTruckNumber(saved.truckNumber);
              if (saved.trailerNumber) setTrailerNumber(saved.trailerNumber);
              setDialog(null);
            }}
          />
        ) : null}
      </QuickCreateDialog>
    </FormSection>
  );
}
