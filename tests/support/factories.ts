import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import type { LoadInput } from "@/features/loads/schemas";
import { loadSchema } from "@/features/loads/schemas";
import type { SessionUser } from "@/server/auth/session";
import type { UserRole } from "@/generated/prisma/enums";

let sequence = 0;
const next = () => ++sequence;

export async function createTestUser(role: UserRole = "ADMIN"): Promise<SessionUser> {
  const n = next();
  const user = await db.user.create({
    data: {
      email: `user${n}@example.test`,
      name: `Test User ${n}`,
      role,
      passwordHash: await hashPassword("test-password-123"),
    },
  });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function createTestClient(overrides: { status?: "ACTIVE" | "ARCHIVED" } = {}) {
  return db.client.create({ data: { companyName: `Client ${next()}`, contactName: "Casey", ...overrides } });
}

export async function createTestCarrier() {
  return db.carrier.create({
    data: {
      legalName: `Carrier ${next()}`,
      mcNumber: "MC123",
      drivers: { create: { firstName: "Dana", lastName: "Driver", truckNumber: "T1" } },
    },
    include: { drivers: true },
  });
}

// Builds a valid LoadInput through the real schema (as the server action would).
export function loadInput(values: Record<string, string>): LoadInput {
  return loadSchema.parse({
    type: "DRAYAGE",
    loadDate: "2026-10-01",
    containerNumber: "abcu 123456-7",
    pickupLocationName: "Maher Terminals",
    pickupCity: "Elizabeth",
    pickupStateProvince: "NJ",
    pickupDate: "2026-10-02",
    deliveryLocationName: "Warehouse",
    deliveryCity: "Carteret",
    deliveryStateProvince: "NJ",
    deliveryDate: "2026-10-02",
    internalNotes: "INTERNAL-SECRET-NOTE",
    ...values,
  });
}
