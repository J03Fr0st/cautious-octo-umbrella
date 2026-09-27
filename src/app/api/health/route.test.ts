import { afterAll, expect, test } from "vitest";
import { pool } from "@/db";
import { GET } from "./route";

afterAll(() => pool.end());

test("GET /api/health queries the database and returns ok", async () => {
  const response = await GET();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});
