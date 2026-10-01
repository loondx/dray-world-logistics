import Decimal from "decimal.js";

import type { WeightUnit } from "@/generated/prisma/enums";

// "27,650 lbs" — shared by the UI and generated documents.
export function formatWeight(weight: { toString(): string } | null, unit: WeightUnit): string | null {
  if (weight === null) return null;
  const value = new Decimal(weight.toString());
  const formatted = value.isInteger() ? value.toNumber().toLocaleString("en-US") : value.toFixed(2);
  return `${formatted} ${unit === "KG" ? "kg" : "lbs"}`;
}

export function formatMiles(miles: number | null): string | null {
  return miles === null ? null : `${miles.toLocaleString("en-US")} miles`;
}
