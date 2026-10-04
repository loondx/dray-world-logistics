import Decimal from "decimal.js";

// All money arithmetic goes through decimal.js — never JavaScript floats.
// Database values arrive as Prisma Decimals, which stringify losslessly.

export type MoneyValue = Decimal | string | { toString(): string } | null | undefined;

export const CURRENCY = "USD";

const MONEY_INPUT_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export function toDecimal(value: MoneyValue): Decimal | null {
  if (value === null || value === undefined) return null;
  const text = value.toString().trim();
  if (text === "") return null;
  return new Decimal(text);
}

// Accepts user input such as "1,850", "$1850.5" or "1850.50"; returns a
// normalised "1850.50" string, null for blank input, or undefined when invalid.
export function normalizeMoneyInput(input: string): string | null | undefined {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  if (!MONEY_INPUT_PATTERN.test(cleaned)) return undefined;
  return new Decimal(cleaned).toFixed(2);
}

// Gross margin = client rate − carrier rate. Null unless both are known.
export function calculateMargin(clientRate: MoneyValue, carrierRate: MoneyValue): Decimal | null {
  const client = toDecimal(clientRate);
  const carrier = toDecimal(carrierRate);
  if (!client || !carrier) return null;
  return client.minus(carrier);
}

export function marginPercent(clientRate: MoneyValue, carrierRate: MoneyValue): Decimal | null {
  const client = toDecimal(clientRate);
  const margin = calculateMargin(clientRate, carrierRate);
  if (!client || !margin || client.isZero()) return null;
  return margin.dividedBy(client).times(100);
}

export function sumMoney(values: MoneyValue[]): Decimal {
  return values.reduce<Decimal>((total, value) => total.plus(toDecimal(value) ?? 0), new Decimal(0));
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plainFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Intl formats decimal strings exactly (no float conversion) on Node 24+/modern browsers.
type IntlDecimalString = `${number}`;

function asIntlString(value: Decimal): IntlDecimalString {
  return value.toFixed(2) as IntlDecimalString;
}

export function formatMoney(value: MoneyValue, fallback = "-"): string {
  const decimal = toDecimal(value);
  return decimal ? currencyFormatter.format(asIntlString(decimal)) : fallback;
}

// "1,850.00" without the currency symbol (for PDF tables).
export function formatAmount(value: MoneyValue, fallback = ""): string {
  const decimal = toDecimal(value);
  return decimal ? plainFormatter.format(asIntlString(decimal)) : fallback;
}
