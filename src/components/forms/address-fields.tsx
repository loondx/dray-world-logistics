"use client";

import { COUNTRY_OPTIONS } from "@/lib/validation/address";

import { Field, TextField } from "./field";
import { NativeSelect } from "./native-select";

type AddressValues = {
  addressLine1?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

// Street / city / state / ZIP / country, submitted with an optional name prefix
// (e.g. prefix "pickup" → "pickupAddressLine1").
export function AddressFields({
  prefix,
  defaults,
  fieldError,
  defaultCountry = "USA",
}: {
  prefix?: string;
  defaults?: AddressValues;
  fieldError: (name: string) => string | undefined;
  defaultCountry?: string;
}) {
  const n = (field: string) => (prefix ? `${prefix}${field[0]?.toUpperCase()}${field.slice(1)}` : field);

  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <TextField
        className="sm:col-span-6"
        label="Street address"
        name={n("addressLine1")}
        defaultValue={defaults?.addressLine1 ?? ""}
        error={fieldError(n("addressLine1"))}
        autoComplete="off"
      />
      <TextField
        className="sm:col-span-2"
        label="City"
        name={n("city")}
        defaultValue={defaults?.city ?? ""}
        error={fieldError(n("city"))}
        autoComplete="off"
      />
      <TextField
        label="State / Prov."
        name={n("stateProvince")}
        defaultValue={defaults?.stateProvince ?? ""}
        error={fieldError(n("stateProvince"))}
        maxLength={50}
        autoComplete="off"
      />
      <TextField
        label="ZIP / Postal"
        name={n("postalCode")}
        defaultValue={defaults?.postalCode ?? ""}
        error={fieldError(n("postalCode"))}
        autoComplete="off"
      />
      <Field label="Country" className="sm:col-span-2" error={fieldError(n("country"))}>
        {(props) => (
          <NativeSelect {...props} name={n("country")} defaultValue={defaults?.country ?? defaultCountry}>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </NativeSelect>
        )}
      </Field>
    </div>
  );
}
