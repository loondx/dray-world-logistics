import type { LoadType, ShipmentDirection } from "@/generated/prisma/enums";

// Equipment choices per load type. Stored as plain text on the load, so new
// options can be added here without a database migration.
export const EQUIPMENT_OPTIONS: Record<LoadType, { types: readonly string[]; sizes: readonly string[] }> = {
  DRAYAGE: {
    types: ["Dry Container", "Reefer Container", "Flat Rack", "Open Top", "Tank Container"],
    sizes: ["20'", "40'", "40' HC", "45'", "53'"],
  },
  OTR: {
    types: ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Conestoga", "Power Only"],
    sizes: ["53'", "48'", "40'", "26'"],
  },
};

export const LOAD_TYPE_LABELS: Record<LoadType, string> = {
  DRAYAGE: "Drayage",
  OTR: "OTR",
};

export const LOAD_TYPE_DESCRIPTIONS: Record<LoadType, string> = {
  DRAYAGE: "Port / rail container moves — import, export, empty returns.",
  OTR: "Over-the-road truckload between shipper and receiver.",
};

export const DIRECTION_LABELS: Record<ShipmentDirection, string> = {
  IMPORT: "Import",
  EXPORT: "Export",
  OTHER: "Other",
};
