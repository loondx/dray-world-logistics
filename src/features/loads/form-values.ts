import type { Load } from "@/generated/prisma/client";
import { toDateInputValue } from "@/lib/dates";
import { toDecimal } from "@/lib/money";

// Plain-string snapshot of a load for pre-filling the edit form (safe to pass
// from a Server Component to the Client Component form).
export type LoadFormValues = {
  clientId: string;
  loadDate: string;
  customerReference: string;
  containerNumber: string;
  bookingNumber: string;
  sealNumber: string;
  equipmentType: string;
  equipmentSize: string;
  direction: string;
  commodity: string;
  weight: string;
  weightUnit: string;
  pieces: string;
  miles: string;
  specialInstructions: string;
  carrierId: string;
  driverId: string;
  truckNumber: string;
  trailerNumber: string;
  clientRate: string;
  carrierRate: string;
  internalNotes: string;
  pickup: StopFormValues;
  delivery: StopFormValues;
};

export type StopFormValues = {
  locationName: string;
  addressLine1: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  appointmentNumber: string;
  contact: string;
  notes: string;
};

export const EMPTY_STOP: StopFormValues = {
  locationName: "",
  addressLine1: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "USA",
  date: "",
  timeFrom: "",
  timeTo: "",
  appointmentNumber: "",
  contact: "",
  notes: "",
};

const text = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export function toLoadFormValues(load: Load, includeRates: boolean): LoadFormValues {
  const stop = (prefix: "pickup" | "delivery"): StopFormValues => ({
    locationName: text(load[`${prefix}LocationName`]),
    addressLine1: text(load[`${prefix}AddressLine1`]),
    city: text(load[`${prefix}City`]),
    stateProvince: text(load[`${prefix}StateProvince`]),
    postalCode: text(load[`${prefix}PostalCode`]),
    country: text(load[`${prefix}Country`]),
    date: toDateInputValue(load[`${prefix}Date`]),
    timeFrom: text(load[`${prefix}TimeFrom`]),
    timeTo: text(load[`${prefix}TimeTo`]),
    appointmentNumber: text(load[`${prefix}AppointmentNumber`]),
    contact: text(load[`${prefix}Contact`]),
    notes: text(load[`${prefix}Notes`]),
  });

  return {
    clientId: load.clientId,
    loadDate: toDateInputValue(load.loadDate),
    customerReference: text(load.customerReference),
    containerNumber: text(load.containerNumber),
    bookingNumber: text(load.bookingNumber),
    sealNumber: text(load.sealNumber),
    equipmentType: text(load.equipmentType),
    equipmentSize: text(load.equipmentSize),
    direction: text(load.direction),
    commodity: text(load.commodity),
    weight: toDecimal(load.weight)?.toString() ?? "",
    weightUnit: load.weightUnit,
    pieces: text(load.pieces),
    miles: text(load.miles),
    specialInstructions: text(load.specialInstructions),
    carrierId: text(load.carrierId),
    driverId: text(load.driverId),
    truckNumber: text(load.truckNumber),
    trailerNumber: text(load.trailerNumber),
    clientRate: includeRates ? (toDecimal(load.clientRate)?.toFixed(2) ?? "") : "",
    carrierRate: includeRates ? (toDecimal(load.carrierRate)?.toFixed(2) ?? "") : "",
    internalNotes: text(load.internalNotes),
    pickup: stop("pickup"),
    delivery: stop("delivery"),
  };
}

export function emptyLoadFormValues(loadDate: string): LoadFormValues {
  return {
    clientId: "",
    loadDate,
    customerReference: "",
    containerNumber: "",
    bookingNumber: "",
    sealNumber: "",
    equipmentType: "",
    equipmentSize: "",
    direction: "",
    commodity: "",
    weight: "",
    weightUnit: "LB",
    pieces: "",
    miles: "",
    specialInstructions: "",
    carrierId: "",
    driverId: "",
    truckNumber: "",
    trailerNumber: "",
    clientRate: "",
    carrierRate: "",
    internalNotes: "",
    pickup: EMPTY_STOP,
    delivery: EMPTY_STOP,
  };
}
