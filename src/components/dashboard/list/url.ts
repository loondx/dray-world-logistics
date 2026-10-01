export type SearchParamsRecord = Record<string, string | string[] | undefined>;

// Builds a URL from the current search params plus overrides (null removes a key).
export function buildHref(
  pathname: string,
  current: SearchParamsRecord,
  overrides: Record<string, string | null>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    const single = Array.isArray(value) ? value[0] : value;
    if (single) params.set(key, single);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
