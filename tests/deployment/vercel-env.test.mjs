import assert from "node:assert/strict";
import { test } from "node:test";
import { validateVercelEnvironment as validate } from "../../scripts/vercel-env.mjs";

const valid = {
  DATABASE_URL: "postgresql://user:secret@db.example/app",
  APP_URL: "https://app.example",
  BLOB_READ_WRITE_TOKEN: "test-token",
};

test("accepts configured deployments and optional blank direct connection", () => {
  assert.deepEqual(validate(valid), []);
  assert.deepEqual(validate({ ...valid, DATABASE_URL_UNPOOLED: " " }), []);
});

test("rejects missing and invalid deployment configuration without exposing secrets", () => {
  assert.deepEqual(validate({}), []);
  assert.deepEqual(validate({ DATABASE_URL: " " }), []);
  for (const override of [
    { DATABASE_URL: "https://db.example" },
    { DATABASE_URL_UNPOOLED: "invalid" },
    { APP_URL: "http://localhost:3000" },
    { BLOB_READ_WRITE_TOKEN: " " },
    { STORAGE_DRIVER: "local" },
  ]) {
    assert.ok(validate({ ...valid, ...override }).length);
  }
  assert.ok(
    !validate({ ...valid, DATABASE_URL: "secret-value" })
      .join()
      .includes("secret-value"),
  );
});
