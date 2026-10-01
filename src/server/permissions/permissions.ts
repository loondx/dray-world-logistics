import type { UserRole } from "@/generated/prisma/enums";

// Deliberately small permission model for V1. Roles exist so access can be
// narrowed later without touching call sites: code checks permissions, never roles.
export const PERMISSIONS = [
  "loads:read",
  "loads:write",
  "masterdata:read", // clients, carriers, drivers
  "masterdata:write",
  "financials:read", // client rate, carrier rate, margin
  "financials:write",
  "documents:read",
  "documents:write", // generate + upload
  "documents:delete",
  "quotes:read",
  "quotes:write",
  "settings:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;
const READ_ONLY: readonly Permission[] = ["loads:read", "masterdata:read", "documents:read"];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: ALL,
  OPERATIONS: ALL.filter((p) => p !== "settings:manage"),
  DISPATCHER: [
    ...READ_ONLY,
    "loads:write",
    "masterdata:write",
    "documents:write",
    "financials:read",
    "financials:write",
  ],
  ACCOUNTING: [...READ_ONLY, "financials:read", "financials:write", "documents:write", "quotes:read"],
  READ_ONLY,
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
