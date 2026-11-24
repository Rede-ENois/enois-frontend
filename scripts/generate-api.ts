#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { eDocumentoDeOpenApi } from "../src/lib/developers/openapi-spec";

/**
 * Gera o cliente da API a partir de `specs/openapi.json` (orval).
 *
 * Duas coisas importam aqui:
 *
 * 1. O guard. O arquivo do repo e, hoje, um ESQUELETO (zero rotas), porque o backend nao publica
 *    documento OpenAPI (o springdoc saiu no lote de seguranca). Sem o guard, a geracao quebra com
 *    uma pilha de erro do orval que nao diz nada — e um esqueleto pode passar como se fosse a API.
 * 2. A chamada e pela CLI (`orval --config ...`), e nao por `generate()` do `@orval/core`: na versao
 *    travada do lock (7.21.0) o `generate` nao e exportado pelo `@orval/core` (ele esta no pacote
 *    `orval`), entao o import antigo quebrava com "generate is not a function".
 */

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const specPath = resolve(root, "specs/openapi.json");

const bruto = await readFile(specPath, "utf8").catch(() => "");
let documento: boolean;
try {
  documento = eDocumentoDeOpenApi(JSON.parse(bruto));
} catch {
  documento = false;
}

if (!documento) {
  console.error("specs/openapi.json nao tem rotas: nao ha documento OpenAPI para gerar cliente.");
  console.error(
    "O backend nao publica OpenAPI (o springdoc saiu no lote de seguranca). O contrato da API",
    "esta na pagina /developers do app e no indice GET /api/v1.",
  );
  process.exit(1);
}

const binario = resolve(root, "node_modules/.bin/orval");
const filho = spawn(binario, ["--config", resolve(root, "orval.config.ts")], {
  cwd: root,
  stdio: "inherit",
});
filho.on("exit", (codigo) => {
  process.exitCode = codigo ?? 1;
});
