// Public website copy. Only states what the company does (confirmed service list);
// no invented statistics, years in business, fleet sizes, certifications or locations.

// Search / social description of the public site (one or two sentences).
export const SITE_DESCRIPTION =
  "Global freight connections, handled and delivered across the USA and Canada. Containerized logistics from port to final delivery: import/export containers, port transportation, drayage, yard, rail/intermodal, OTR, FTL and LTL.";

// Short line for share cards, where space is tight.
export const SITE_TAGLINE = "Containerized logistics, port to door. USA & Canada.";

export type ServiceKey =
  "drayage" | "import-export" | "ftl" | "ltl" | "otr" | "intermodal" | "port" | "yard" | "cross-border";

export const SERVICES: { key: ServiceKey; name: string; summary: string }[] = [
  {
    key: "drayage",
    name: "Drayage",
    summary:
      "Container moves between ports, rail ramps, yards and warehouses, with appointments and paperwork handled.",
  },
  {
    key: "import-export",
    name: "Import / Export Containers",
    summary: "Pickups, deliveries and empty returns for ocean containers, lined up with terminal schedules.",
  },
  {
    key: "ftl",
    name: "Full Truckload (FTL)",
    summary: "Dedicated trucks for full loads, with the carrier and driver confirmed before pickup.",
  },
  {
    key: "ltl",
    name: "Less-than-Truckload (LTL)",
    summary: "Right-sized capacity when your freight doesn't fill a whole trailer.",
  },
  {
    key: "otr",
    name: "Over-the-Road (OTR)",
    summary: "Long-haul lanes planned end to end, from pickup appointment to delivery.",
  },
  {
    key: "intermodal",
    name: "Rail / Intermodal",
    summary: "Road and rail combined, with the dray legs at both ends coordinated as one move.",
  },
  {
    key: "port",
    name: "Port Transportation",
    summary: "Terminal pickups and returns, gate appointments and container details captured once.",
  },
  {
    key: "yard",
    name: "Yard Transportation",
    summary: "Short moves between terminals, yards and facilities when timing matters.",
  },
  {
    key: "cross-border",
    name: "Cross-Border USA ⇄ Canada",
    summary: "Freight moving between the United States and Canada, coordinated where applicable.",
  },
];

// Landing-page process: four visual steps, a few words each.
export const PROCESS_STEPS: { title: string; body: string }[] = [
  { title: "Request", body: "Tell us what needs to move." },
  { title: "Move", body: "Pickup at the port, ramp or dock." },
  { title: "Handle", body: "Yard, rail and road handoffs coordinated." },
  { title: "Deliver", body: "Delivered, with proof of delivery on file." },
];

export const WHY_POINTS: { title: string; body: string }[] = [
  {
    title: "One point of contact",
    body: "One team plans, dispatches and follows your load from request to delivery.",
  },
  {
    title: "Clear, all-in rates",
    body: "Flat rates confirmed in writing before the load moves.",
  },
  {
    title: "Documents on every load",
    body: "Rate confirmations, bills of lading and PODs kept together and easy to retrieve.",
  },
  {
    title: "USA & Canada lanes",
    body: "Headquartered in the Greater Toronto Area, moving freight on both sides of the border.",
  },
];

export const QUOTE_SERVICE_OPTIONS = [
  "Drayage",
  "Import / Export Container",
  "Full Truckload (FTL)",
  "Less-than-Truckload (LTL)",
  "Over-the-Road (OTR)",
  "Rail / Intermodal",
  "Port Transportation",
  "Yard Transportation",
  "Cross-Border",
  "Other",
] as const;

/** Equipment choices on the website quote form. */
export const EQUIPMENT_OPTIONS = [
  "20' container",
  "40' container",
  "40' high cube",
  "45' container",
  "53' dry van",
  "Flatbed",
  "Not sure",
] as const;

/** Which quote-form option each service card pre-selects. */
export const SERVICE_QUOTE_OPTION: Record<ServiceKey, (typeof QUOTE_SERVICE_OPTIONS)[number]> = {
  drayage: "Drayage",
  "import-export": "Import / Export Container",
  ftl: "Full Truckload (FTL)",
  ltl: "Less-than-Truckload (LTL)",
  otr: "Over-the-Road (OTR)",
  intermodal: "Rail / Intermodal",
  port: "Port Transportation",
  yard: "Yard Transportation",
  "cross-border": "Cross-Border",
};
