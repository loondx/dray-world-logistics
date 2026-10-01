import type { UserRole } from "@/generated/prisma/enums";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  OPERATIONS: "Operations",
  DISPATCHER: "Dispatcher",
  ACCOUNTING: "Accounting",
  READ_ONLY: "Read only",
};
