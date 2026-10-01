// Return field names and instructions only; never print connection strings or tokens.
export function validateVercelEnvironment(env) {
  if (!env.DATABASE_URL?.trim()) return [];
  const errors = [];
  for (const field of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
    const value = env[field]?.trim();
    if (!value && field === "DATABASE_URL_UNPOOLED") continue;
    try {
      const url = new URL(value);
      if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
        throw new Error();
      }
    } catch {
      errors.push(
        `${field} must be a PostgreSQL connection URL. Connect a hosted PostgreSQL database to this Vercel project.`,
      );
    }
  }
  try {
    const url = new URL(env.APP_URL);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error();
  } catch {
    errors.push("APP_URL must be the HTTPS URL of this deployment.");
  }
  if (!env.BLOB_READ_WRITE_TOKEN?.trim()) {
    errors.push("BLOB_READ_WRITE_TOKEN is required. Connect a private Vercel Blob store.");
  }
  if (env.STORAGE_DRIVER && env.STORAGE_DRIVER !== "blob") {
    errors.push("STORAGE_DRIVER must be blob on Vercel; local files are not persistent.");
  }
  return errors;
}
