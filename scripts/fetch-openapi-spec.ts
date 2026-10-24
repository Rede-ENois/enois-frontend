#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendUrl = process.argv[2] ?? process.env.OPENAPI_BACKEND_URL ?? "http://localhost:8081";
const specUrl = `${backendUrl.replace(/\/$/, "")}/api/openapi.json`;
const outputPath = resolve(root, "specs/openapi.json");

if (process.env.FETCH_OPENAPI !== "1") {
  console.log("Skipping OpenAPI fetch; using specs/openapi.json.");
  console.log("Set FETCH_OPENAPI=1 after starting the backend to refresh the spec.");
  process.exit(0);
}

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5_000);

try {
  console.log(`Fetching OpenAPI spec from ${specUrl}...`);
  const response = await fetch(specUrl, {
    headers: { Accept: "application/json" },
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const spec = (await response.json()) as { openapi?: unknown; paths?: unknown };
  if (typeof spec.openapi !== "string" || typeof spec.paths !== "object") {
    throw new Error("Response is not a valid OpenAPI document");
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  console.log(`OpenAPI spec saved to ${outputPath}`);
} catch (error) {
  console.warn("Backend unavailable; keeping the checked-in placeholder spec.");
  console.warn(error instanceof Error ? error.message : String(error));
} finally {
  clearTimeout(timeoutId);
}
