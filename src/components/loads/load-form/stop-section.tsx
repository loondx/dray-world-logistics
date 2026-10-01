"use client";

import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";

import { Combobox } from "@/components/forms/combobox";
import { Field, TextField } from "@/components/forms/field";
import { FormSection } from "@/components/forms/form-section";
import { NativeSelect } from "@/components/forms/native-select";
import type { StopFormValues } from "@/features/loads/form-values";
import { COUNTRY_OPTIONS } from "@/lib/validation/address";
import type { SavedLocation } from "@/server/services/load.queries";

type Prefix = "pickup" | "delivery";

// One stop (pickup or delivery). Address fields are controlled so choosing a
// saved facility fills them in; everything is submitted with `prefix` names.
export function StopSection({
  prefix,
  title,
  defaults,
  savedLocations,
  fieldError,
}: {
  prefix: Prefix;
  title: string;
  defaults: StopFormValues;
  savedLocations: SavedLocation[];
  fieldError: (name: string) => string | undefined;
}) {
  const [values, setValues] = useState(defaults);
  const [savedPick, setSavedPick] = useState("");
  const name = (field: string) => `${prefix}${field}`;

  const options = useMemo(
    () =>
      savedLocations.map((location, index) => ({
        value: String(index),
        label: location.locationName,
        description: [location.addressLine1, location.city, location.stateProvince]
          .filter(Boolean)
          .join(", "),
      })),
    [savedLocations],
  );

  function applySaved(indexValue: string) {
    const location = savedLocations[Number(indexValue)];
    if (!location) return;
    setSavedPick("");
    setValues((current) => ({
      ...current,
      locationName: location.locationName,
      addressLine1: location.addressLine1 ?? "",
      city: location.city ?? "",
      stateProvince: location.stateProvince ?? "",
      postalCode: location.postalCode ?? "",
      country: location.country ?? current.country,
      contact: location.contact ?? current.contact,
    }));
  }

  function set(field: keyof StopFormValues) {
    return (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));
  }

  return (
    <FormSection
      title={title}
      actions={
        options.length > 0 ? (
          <div className="w-48 sm:w-60">
            <Combobox
              options={options}
              value={savedPick}
              onChange={applySaved}
              placeholder="Use saved location…"
              searchPlaceholder="Search facilities…"
            />
          </div>
        ) : (
          <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
        )
      }
    >
      <div className="grid gap-3 sm:grid-cols-6">
        <TextField
          className="sm:col-span-3"
          label="Facility / location name"
          name={name("LocationName")}
          value={values.locationName}
          onChange={set("locationName")}
          placeholder={prefix === "pickup" ? "e.g. Maher Terminals" : "e.g. Warehouse name"}
          error={fieldError(name("LocationName"))}
          autoComplete="off"
        />
        <TextField
          className="sm:col-span-3"
          label="Street address"
          name={name("AddressLine1")}
          value={values.addressLine1}
          onChange={set("addressLine1")}
          error={fieldError(name("AddressLine1"))}
          autoComplete="off"
        />
        <TextField
          className="sm:col-span-2"
          label="City"
          name={name("City")}
          value={values.city}
          onChange={set("city")}
          error={fieldError(name("City"))}
          autoComplete="off"
        />
        <TextField
          label="State / Prov."
          name={name("StateProvince")}
          value={values.stateProvince}
          onChange={set("stateProvince")}
          error={fieldError(name("StateProvince"))}
          autoComplete="off"
        />
        <TextField
          label="ZIP / Postal"
          name={name("PostalCode")}
          value={values.postalCode}
          onChange={set("postalCode")}
          error={fieldError(name("PostalCode"))}
          autoComplete="off"
        />
        <Field label="Country" className="sm:col-span-2">
          {(props) => (
            <NativeSelect {...props} name={name("Country")} value={values.country} onChange={set("country")}>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <TextField
          className="sm:col-span-2"
          label="Date"
          name={name("Date")}
          type="date"
          defaultValue={values.date}
          error={fieldError(name("Date"))}
        />
        <TextField
          label="From"
          name={name("TimeFrom")}
          type="time"
          defaultValue={values.timeFrom}
          error={fieldError(name("TimeFrom"))}
        />
        <TextField
          label="To"
          name={name("TimeTo")}
          type="time"
          defaultValue={values.timeTo}
          error={fieldError(name("TimeTo"))}
        />
        <TextField
          className="sm:col-span-2"
          label="Appointment #"
          name={name("AppointmentNumber")}
          defaultValue={values.appointmentNumber}
          error={fieldError(name("AppointmentNumber"))}
        />

        <TextField
          className="sm:col-span-3"
          label="Contact (name / phone)"
          name={name("Contact")}
          value={values.contact}
          onChange={set("contact")}
          error={fieldError(name("Contact"))}
          autoComplete="off"
        />
        <TextField
          className="sm:col-span-3"
          label="Instructions"
          name={name("Notes")}
          defaultValue={values.notes}
          hint="Printed on documents."
          error={fieldError(name("Notes"))}
        />
      </div>
    </FormSection>
  );
}
