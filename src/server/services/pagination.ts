export const PAGE_SIZE = 25;

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number };

export function pageArgs(page: number, pageSize = PAGE_SIZE) {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  return { skip: (safePage - 1) * pageSize, take: pageSize, page: safePage, pageSize };
}

// Reads ?page= from search params.
export function parsePage(value: string | string[] | undefined): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed.slice(0, 100) : undefined;
}
