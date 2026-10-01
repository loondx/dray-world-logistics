/**
 * First-admin bootstrap / password reset.
 *
 *   pnpm admin:create --email ops@example.com --name "Jane Doe"
 *   pnpm admin:create --email ops@example.com --reset-password
 *
 * The password is read from INITIAL_ADMIN_PASSWORD if set, otherwise prompted
 * for (input hidden). No default credentials exist anywhere in the system.
 */
import "dotenv/config";

import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

import { z } from "zod";

import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { createPrismaClient } from "@/lib/db/create-client";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    "reset-password": { type: "boolean", default: false },
  },
});

function prompt(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    // Suppress echo of typed characters while keeping the prompt visible.
    const write = process.stdout.write.bind(process.stdout);
    let prompted = false;
    Object.assign(rl, {
      _writeToOutput: (chunk: string) => {
        if (!prompted) {
          prompted = true;
          write(chunk);
        }
      },
    });
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

const inputSchema = z.object({
  email: z.email("A valid email is required."),
  name: z.string().trim().min(1, "Name is required.").max(120),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(512),
});

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const email = (
    values.email ??
    process.env.INITIAL_ADMIN_EMAIL ??
    (await prompt("Admin email: "))
  ).toLowerCase();
  const resetPassword = values["reset-password"];
  const name = resetPassword ? "unchanged" : (values.name ?? (await prompt("Full name: ")));

  let password = process.env.INITIAL_ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await prompt(`Password (min ${MIN_PASSWORD_LENGTH} chars): `, true);
    const confirm = await prompt("Confirm password: ", true);
    if (password !== confirm) throw new Error("Passwords do not match.");
  }

  const parsed = inputSchema.safeParse({ email, name, password });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(" "));
  }

  const db = createPrismaClient(databaseUrl);
  try {
    const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
    const passwordHash = await hashPassword(parsed.data.password);

    if (resetPassword) {
      if (!existing) throw new Error(`No user with email ${parsed.data.email}.`);
      await db.$transaction([
        db.user.update({ where: { id: existing.id }, data: { passwordHash, active: true } }),
        db.session.deleteMany({ where: { userId: existing.id } }),
      ]);
      console.log(`Password reset for ${parsed.data.email}. All existing sessions were signed out.`);
      return;
    }

    if (existing) {
      throw new Error(
        `A user with email ${parsed.data.email} already exists. Use --reset-password to change it.`,
      );
    }

    const user = await db.user.create({
      data: { email: parsed.data.email, name: parsed.data.name, passwordHash, role: "ADMIN" },
      select: { id: true },
    });
    await db.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.USER_CREATED,
        entityType: AUDIT_ENTITIES.USER,
        entityId: user.id,
        userId: null,
        metadata: { via: "cli", role: "ADMIN" },
      },
    });
    console.log(`Administrator ${parsed.data.email} created.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
