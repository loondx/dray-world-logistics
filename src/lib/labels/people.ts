export function driverFullName(driver: { firstName: string; lastName: string | null }): string {
  return [driver.firstName, driver.lastName].filter(Boolean).join(" ");
}

export function formatCityState(city: string | null | undefined, state: string | null | undefined): string {
  return [city, state].filter(Boolean).join(", ");
}
