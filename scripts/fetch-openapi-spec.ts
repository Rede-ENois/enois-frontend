#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { avisoSemOpenApi, eDocumentoDeOpenApi } from "../src/lib/developers/openapi-spec";

/**
 * Busca o documento OpenAPI da API e grava em `specs/openapi.json`.
 *
 * ATENCAO: o backend NAO publica documento OpenAPI. O springdoc saiu do `pom.xml` no lote de
 * seguranca (incompativel com o Boot 4, e a UI dele expunha a superficie inteira da API). Nao ha
 * `/openapi.json` no backend: o caminho responde a mesma coisa que qualquer rota desconhecida
 * (200 sem corpo). O contrato da API esta na pagina `/developers` do app e no indice
 * `GET /api/v1` (montado pelo roteador de verdade).
 *
 * Este script continua aqui porque a.pipeline de geracao de cliente (orval) deve voltar a
 * funcionar no dia em que houver um documento gerado e revisado — mas ele agora diz a verdade em
 * vez de deixar passar um esqueleto vazio como se fosse a API.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const explicitFetch = process.env.FETCH_OPENAPI === "1" || process.argv.includes("--fetch");
const backendUrl =
  process.argv.slice(2).find((argument) => argument !== "--fetch") ??
  process.env.OPENAPI_BACKEND_URL ??
  "http://localhost:8081";
const specUrl = `${backendUrl.replace(/\/$/, "")}/api/openapi.json`;
const outputPath = resolve(root, "specs/openapi.json");

const SEM_OPENAPI = avisoSemOpenApi();

if (!explicitFetch) {
  const guardado = await readFile(outputPath, "utf8").catch(() => "");
  let esqueleto: boolean;
  try {
    esqueleto = !eDocumentoDeOpenApi(JSON.parse(guardado));
  } catch {
    esqueleto = true;
  }
  if (esqueleto) {
    console.error("specs/openapi.json nao e um documento: e o esqueleto (zero rotas).");
    console.error(SEM_OPENAPI);
    console.error("A geracao de cliente nao roda sobre um esqueleto.");
    process.exitCode = 1;
    process.exit(1);
  }
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
  if (
    typeof spec.openapi !== "string" ||
    typeof spec.paths !== "object" ||
    spec.paths === null ||
    Object.keys(spec.paths).length === 0
  ) {
    // O backend responde 200 com corpo em branco no caminho que nao existe: o parse falha aqui.
    throw new Error(`Response is not a valid OpenAPI document. ${SEM_OPENAPI}`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  console.log(`OpenAPI spec saved to ${outputPath}`);
} catch (error) {
  console.error("Failed to fetch a valid OpenAPI spec; generation was not started.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  clearTimeout(timeoutId);
}
