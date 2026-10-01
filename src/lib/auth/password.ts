import { hash, verify } from "@node-rs/argon2";

// Argon2id (the library default algorithm) with OWASP-recommended parameters:
// 19 MiB memory, 2 iterations, parallelism 1.
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export { MIN_PASSWORD_LENGTH } from "./password-policy";

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // Malformed hash — treat as a failed verification, never throw to the caller.
    return false;
  }
}

// A valid hash of a random value, used to keep login timing uniform when the
// email does not exist (prevents account enumeration via response time).
let dummyHash: Promise<string> | undefined;
export function getDummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword(crypto.randomUUID());
  return dummyHash;
}
