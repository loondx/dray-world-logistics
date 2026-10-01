import { z } from "zod";

import { LoadStatus, LoadType, ShipmentDirection, WeightUnit } from "@/generated/prisma/enums";
import {
  optionalDateOnly,
  optionalDecimal,
  optionalId,
  optionalLongText,
  optionalMoney,
  optionalPositiveInt,
  optionalText,
  optionalTime,
  requiredDateOnly,
  requiredId,
} from "@/lib/validation/fields";

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

// Container numbers are stored upper-case without spaces ("OOLU 620180-1" → "OOLU6201801").
const containerNumber = z.preprocess(
  (value) => (typeof value === "string" ? value.replace(/[\s-]/g, "").toUpperCase() : value),
  optionalText(20),
);

// Shared field schemas for the pickup and delivery stops.
const stop = {
  locationName: optionalText(200),
  addressLine1: optionalText(200),
  city: optionalText(100),
  stateProvince: optionalText(50),
  postalCode: optionalText(20),
  country: optionalText(60),
  date: optionalDateOnly,
  time: optionalTime,
  appointmentNumber: optionalText(60),
  contact: optionalText(200),
  notes: optionalText(1000),
};

export const loadSchema = z
  .object({
    type: z.enum(LoadType),
    clientId: requiredId("client"),
    loadDate: requiredDateOnly("Load date"),
    customerReference: optionalText(80),
    containerNumber,
    bookingNumber: optionalText(80),
    sealNumber: optionalText(40),

    equipmentType: optionalText(60),
    equipmentSize: optionalText(30),
    direction: z
      .preprocess(blankToUndefined, z.enum(ShipmentDirection).optional())
      .transform((v) => v ?? null),

    commodity: optionalText(200),
    weight: optionalDecimal,
    weightUnit: z.preprocess(blankToUndefined, z.enum(WeightUnit).default("LB")),
    pieces: optionalPositiveInt,
    miles: optionalPositiveInt,
    specialInstructions: optionalLongText,

    pickupLocationName: stop.locationName,
    pickupAddressLine1: stop.addressLine1,
    pickupCity: stop.city,
    pickupStateProvince: stop.stateProvince,
    pickupPostalCode: stop.postalCode,
    pickupCountry: stop.country,
    pickupDate: stop.date,
    pickupTimeFrom: stop.time,
    pickupTimeTo: stop.time,
    pickupAppointmentNumber: stop.appointmentNumber,
    pickupContact: stop.contact,
    pickupNotes: stop.notes,

    deliveryLocationName: stop.locationName,
    deliveryAddressLine1: stop.addressLine1,
    deliveryCity: stop.city,
    deliveryStateProvince: stop.stateProvince,
    deliveryPostalCode: stop.postalCode,
    deliveryCountry: stop.country,
    deliveryDate: stop.date,
    deliveryTimeFrom: stop.time,
    deliveryTimeTo: stop.time,
    deliveryAppointmentNumber: stop.appointmentNumber,
    deliveryContact: stop.contact,
    deliveryNotes: stop.notes,

    carrierId: optionalId,
    driverId: optionalId,
    truckNumber: optionalText(40),
    trailerNumber: optionalText(40),

    clientRate: optionalMoney,
    carrierRate: optionalMoney,

    internalNotes: optionalLongText,
  })
  .superRefine((load, ctx) => {
    if (load.driverId && !load.carrierId) {
      ctx.addIssue({ code: "custom", path: ["driverId"], message: "Select the driver's carrier first." });
    }
    if (load.pickupDate && load.deliveryDate && load.deliveryDate < load.pickupDate) {
      ctx.addIssue({ code: "custom", path: ["deliveryDate"], message: "Delivery can't be before pickup." });
    }
  });

export type LoadInput = z.infer<typeof loadSchema>;

export const statusChangeSchema = z.object({
  status: z.enum(LoadStatus, { error: "Select a status." }),
  notes: optionalText(500),
});
