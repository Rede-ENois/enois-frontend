import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseArgs, resolveBin, runBin } from "./run-local-bin.mjs";

const script = fileURLToPath(new URL("./run-local-bin.mjs", import.meta.url));

// Projeto falso com um pacote "fake" cujo binário sai com o código recebido no primeiro argumento.
// Os testes não dependem de nada instalado no node_modules do repositório (o job de hooks do CI
// roda sem `npm ci`).
function fakeProject(bin) {
  const root = mkdtempSync(join(tmpdir(), "run-local-bin-"));
  const pkgDir = join(root, "node_modules", "fake");
  mkdirSync(join(pkgDir, "bin"), { recursive: true });
  writeFileSync(join(pkgDir, "package.json"), JSON.stringify({ name: "fake", bin }));
  writeFileSync(join(pkgDir, "bin", "fake.js"), "process.exit(Number(process.argv[2] ?? 0));\n");
  return root;
}

test("resolve o binário declarado como objeto no package.json", () => {
  const root = fakeProject({ fake: "bin/fake.js" });
  assert.equal(resolveBin(root, "fake"), join(root, "node_modules", "fake", "bin", "fake.js"));
});

test("resolve o binário declarado como string no package.json", () => {
  const root = fakeProject("bin/fake.js");
  assert.equal(
    resolveBin(root, "fake", "outro"),
    join(root, "node_modules", "fake", "bin", "fake.js"),
  );
});

test("devolve null quando o pacote não está instalado", () => {
  const root = mkdtempSync(join(tmpdir(), "run-local-bin-"));
  assert.equal(resolveBin(root, "fake"), null);
});

test("devolve null quando o binário pedido não existe no pacote", () => {
  const root = fakeProject({ fake: "bin/fake.js" });
  assert.equal(resolveBin(root, "fake", "inexistente"), null);
});

test("separa pacote, binário e argumentos", () => {
  assert.deepEqual(parseArgs(["typescript", "tsc", "--", "--noEmit"]), {
    pkg: "typescript",
    bin: "tsc",
    args: ["--noEmit"],
  });
  assert.deepEqual(parseArgs(["eslint", "--", "--fix", "a.ts"]), {
    pkg: "eslint",
    bin: "eslint",
    args: ["--fix", "a.ts"],
  });
  assert.throws(() => parseArgs([]), /uso:/);
});

test("pacote ausente falha com uma mensagem que manda rodar npm ci", () => {
  const result = spawnSync(process.execPath, [script, "pacote-que-nao-existe", "--", "x"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /npm ci/);
});

test("repassa o código de saída de sucesso do binário", () => {
  const root = fakeProject({ fake: "bin/fake.js" });
  assert.equal(runBin(root, "fake", "fake", ["0"]), 0);
});

test("repassa o código de saída de falha do binário", () => {
  const root = fakeProject({ fake: "bin/fake.js" });
  assert.equal(runBin(root, "fake", "fake", ["3"]), 3);
});

test("devolve null em vez de executar quando o pacote falta", () => {
  const root = mkdtempSync(join(tmpdir(), "run-local-bin-"));
  assert.equal(runBin(root, "fake", "fake", []), null);
});
