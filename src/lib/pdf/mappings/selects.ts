import type { Prisma } from "@/generated/prisma/client";

// Per-document database selections. These are the first line of rate privacy:
// a field that is not selected here cannot reach the mapping or the PDF.

const SHIPMENT_FIELDS = {
  loadNumber: true,
  type: true,
  containerNumber: true,
  bookingNumber: true,
  sealNumber: true,
  equipmentType: true,
  equipmentSize: true,
  direction: true,
  commodity: true,
  weight: true,
  weightUnit: true,
  pieces: true,
  miles: true,
  specialInstructions: true,
} satisfies Prisma.LoadSelect;

const STOP_FIELDS = {
  pickupLocationName: true,
  pickupAddressLine1: true,
  pickupAddressLine2: true,
  pickupCity: true,
  pickupStateProvince: true,
  pickupPostalCode: true,
  pickupCountry: true,
  pickupDate: true,
  pickupTimeFrom: true,
  pickupTimeTo: true,
  pickupAppointmentNumber: true,
  pickupContact: true,
  pickupNotes: true,
  deliveryLocationName: true,
  deliveryAddressLine1: true,
  deliveryAddressLine2: true,
  deliveryCity: true,
  deliveryStateProvince: true,
  deliveryPostalCode: true,
  deliveryCountry: true,
  deliveryDate: true,
  deliveryTimeFrom: true,
  deliveryTimeTo: true,
  deliveryAppointmentNumber: true,
  deliveryContact: true,
  deliveryNotes: true,
} satisfies Prisma.LoadSelect;

const PARTY_ADDRESS = {
  addressLine1: true,
  addressLine2: true,
  city: true,
  stateProvince: true,
  postalCode: true,
  country: true,
  phone: true,
  email: true,
} as const;

const CARRIER_FIELDS = {
  legalName: true,
  dba: true,
  mcNumber: true,
  dotNumber: true,
  contactPerson: true,
  ...PARTY_ADDRESS,
} satisfies Prisma.CarrierSelect;

const DRIVER_FIELDS = {
  firstName: true,
  lastName: true,
  phone: true,
} satisfies Prisma.DriverSelect;

const CLIENT_FIELDS = {
  companyName: true,
  contactName: true,
  ...PARTY_ADDRESS,
} satisfies Prisma.ClientSelect;

// Carrier load confirmation: carrier rate, carrier + driver. NO client, client rate or internal notes.
export const CARRIER_RATE_CONFIRMATION_SELECT = {
  ...SHIPMENT_FIELDS,
  ...STOP_FIELDS,
  truckNumber: true,
  trailerNumber: true,
  carrierRate: true,
  carrier: { select: CARRIER_FIELDS },
  driver: { select: DRIVER_FIELDS },
} satisfies Prisma.LoadSelect;

// Customer rate confirmation: client rate + client. NO carrier, driver, carrier rate or internal notes.
export const SHIPPER_RATE_CONFIRMATION_SELECT = {
  ...SHIPMENT_FIELDS,
  ...STOP_FIELDS,
  customerReference: true,
  clientRate: true,
  client: { select: CLIENT_FIELDS },
} satisfies Prisma.LoadSelect;

// Bill of lading: parties and cargo. NO rates of any kind, NO internal notes.
export const BILL_OF_LADING_SELECT = {
  ...SHIPMENT_FIELDS,
  ...STOP_FIELDS,
  customerReference: true,
  truckNumber: true,
  trailerNumber: true,
  client: { select: CLIENT_FIELDS },
  carrier: { select: CARRIER_FIELDS },
  driver: { select: DRIVER_FIELDS },
} satisfies Prisma.LoadSelect;

export type CarrierRateConfirmationSource = Prisma.LoadGetPayload<{
  select: typeof CARRIER_RATE_CONFIRMATION_SELECT;
}>;
export type ShipperRateConfirmationSource = Prisma.LoadGetPayload<{
  select: typeof SHIPPER_RATE_CONFIRMATION_SELECT;
}>;
export type BillOfLadingSource = Prisma.LoadGetPayload<{ select: typeof BILL_OF_LADING_SELECT }>;
