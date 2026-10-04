import type { DocumentContext } from "@/lib/pdf/mappings/common";
import type {
  BillOfLadingSource,
  CarrierRateConfirmationSource,
  InvoiceSource,
  ShipperRateConfirmationSource,
} from "@/lib/pdf/mappings/selects";

// Fictitious shipment used by PDF mapping/rendering tests.
const shipment = {
  loadNumber: 100001,
  type: "DRAYAGE",
  containerNumber: "OOLU6201801",
  bookingNumber: "BK-778812",
  sealNumber: "SL-44120",
  equipmentType: "Reefer Container",
  equipmentSize: "40' HC",
  direction: "IMPORT",
  commodity: "Refrigerated food",
  weight: { toString: () => "27650" },
  weightUnit: "LB",
  pieces: 18,
  miles: 11,
  specialInstructions: "Driver must call dispatch 30 minutes before arrival.",
  pickupLocationName: "Maher Terminals",
  pickupAddressLine1: "2180 CDS Bay Ave",
  pickupAddressLine2: null,
  pickupCity: "Elizabeth",
  pickupStateProvince: "NJ",
  pickupPostalCode: "07201",
  pickupCountry: "USA",
  pickupDate: new Date(Date.UTC(2026, 9, 2)),
  pickupTimeFrom: "08:00",
  pickupTimeTo: "16:00",
  pickupAppointmentNumber: "APT-5521",
  pickupContact: "Gate office +1 908-527-8200",
  pickupNotes: "Bring TWIC card.",
  deliveryLocationName: "Garden State Cold Storage",
  deliveryAddressLine1: "580 Port Carteret Dr",
  deliveryAddressLine2: null,
  deliveryCity: "Carteret",
  deliveryStateProvince: "NJ",
  deliveryPostalCode: "07008",
  deliveryCountry: "USA",
  deliveryDate: new Date(Date.UTC(2026, 9, 2)),
  deliveryTimeFrom: "09:00",
  deliveryTimeTo: "15:00",
  deliveryAppointmentNumber: null,
  deliveryContact: "Receiving dock",
  deliveryNotes: null,
} as const;

const client = {
  companyName: "Atlantic Imports (Sample)",
  contactName: "Jordan Lee",
  addressLine1: "100 Harbor Rd",
  addressLine2: null,
  city: "Newark",
  stateProvince: "NJ",
  postalCode: "07105",
  country: "USA",
  phone: "+1 555-0103",
  email: "jordan@atlantic.example",
};

const carrier = {
  legalName: "Northern Haul Transport (Sample)",
  dba: null,
  mcNumber: "MC000000",
  dotNumber: "0000000",
  contactPerson: "Pat Morgan",
  addressLine1: "63 Post Blvd",
  addressLine2: null,
  city: "Carteret",
  stateProvince: "NJ",
  postalCode: "07008",
  country: "USA",
  phone: "(732) 555-0200",
  email: "dispatch@northernhaul.example",
};

const driver = { firstName: "Chris", lastName: "Taylor", phone: "555-0201" };

// Distinctive amounts so tests can search serialized DTOs for leaks.
export const CLIENT_RATE = "2475.55";
export const CARRIER_RATE = "1850.25";

export const carrierSource = {
  ...shipment,
  truckNumber: "T-101",
  trailerNumber: "CH-2201",
  carrierRate: { toString: () => CARRIER_RATE },
  carrier,
  driver,
} as unknown as CarrierRateConfirmationSource;

export const shipperSource = {
  ...shipment,
  customerReference: "PO-99812",
  clientRate: { toString: () => CLIENT_RATE },
  client,
} as unknown as ShipperRateConfirmationSource;

export const invoiceSource = {
  ...shipment,
  customerReference: "PO-99812",
  clientRate: { toString: () => CLIENT_RATE },
  client: { ...client, paymentTermsDays: null },
  charges: [
    { description: "Chassis", amount: { toString: () => "85.00" } },
    { description: "Detention", amount: { toString: () => "120.50" } },
  ],
} as unknown as InvoiceSource;

export const bolSource = {
  ...shipment,
  truckNumber: "T-101",
  trailerNumber: "CH-2201",
  carrier,
  driver,
} as unknown as BillOfLadingSource;

export const documentContext: DocumentContext = {
  company: {
    name: "DRAY-WORLD LOGISTICS INC",
    addressLines: ["9 Nom Crescent Unit 2", "Markham, ON L3S 2B3", "Canada"],
    mcNumber: "1551033",
    dotNumber: "4078507",
    scacCode: "DRBO",
    phone: null,
    email: null,
    logo: null,
  },
  documentDate: "10/01/2026",
  issueDate: new Date(Date.UTC(2026, 9, 1)),
  settings: {
    carrierTerms:
      "Carrier must notify broker of any delay immediately.\nSubmit signed POD within 48 hours of delivery.",
    shipperTerms: "Rates are valid for the shipment described above.",
    bolTerms: null,
    bolInstructions: "Driver must record in/out times at each stop.",
    paymentInstructions: null,
    contactPhone: null,
    contactEmail: null,
    invoicePaymentTermsDays: 30,
    invoiceNotes: "Interest of 2% per month applies to overdue balances.",
    businessNumber: null,
    dunsNumber: "209238475",
  },
};
