import { LoadStatus, LoadType } from "@/generated/prisma/enums";
import { parseDateOnly } from "@/lib/dates";
import type { LoadListFilters, LoadSortField } from "@/server/services/load.queries";

type Params = Record<string, string | string[] | undefined>;

const SORT_FIELDS: readonly LoadSortField[] = ["loadNumber", "pickupDate", "deliveryDate", "status"];

function first(params: Params, key: string): string | undefined {
  const value = params[key];
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed.slice(0, 100) : undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.find((option) => option === value);
}

// URL search params → validated load list filters. Unknown values are ignored.
export function parseLoadListParams(params: Params): LoadListFilters {
  const date = (key: string) => {
    const value = first(params, key);
    return value ? (parseDateOnly(value) ?? undefined) : undefined;
  };
  const status = first(params, "status");
  const page = Number(first(params, "page"));

  return {
    q: first(params, "q"),
    status: status === "ACTIVE" ? "ACTIVE" : oneOf(status, Object.values(LoadStatus)),
    type: oneOf(first(params, "type"), Object.values(LoadType)),
    clientId: first(params, "client"),
    carrierId: first(params, "carrier"),
    driverId: first(params, "driver"),
    pickupFrom: date("pickupFrom"),
    pickupTo: date("pickupTo"),
    deliveryFrom: date("deliveryFrom"),
    deliveryTo: date("deliveryTo"),
    sort: oneOf(first(params, "sort"), SORT_FIELDS) ?? "loadNumber",
    direction: first(params, "dir") === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}
