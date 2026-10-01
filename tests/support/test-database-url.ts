// Integration tests use a dedicated database next to the development one:
// the configured database name with a "_test" suffix. Never the dev/prod database.
export function getTestDatabaseUrl(): string {
  const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL (or TEST_DATABASE_URL) must be set to run integration tests.");
  if (process.env.TEST_DATABASE_URL) return base;

  const url = new URL(base);
  const name = url.pathname.replace(/^\//, "");
  url.pathname = `/${name.endsWith("_test") ? name : `${name}_test`}`;
  return url.toString();
}
