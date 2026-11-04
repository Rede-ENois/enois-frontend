import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseArgs, resolveBin } from "./run-local-bin.mjs";

const script = fileURLToPath(new URL("./run-local-bin.mjs", import.meta.url));

function fakeProject(bin) {
  const root = mkdtempSync(join(tmpdir(), "run-local-bin-"));
  const pkgDir = join(root, "node_modules", "fake");
  mkdirSync(join(pkgDir, "bin"), { recursive: true });
  writeFileSync(join(pkgDir, "package.json"), JSON.stringify({ name: "fake", bin }));
  writeFileSync(join(pkgDir, "bin", "fake.js"), "");
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

test("repassa o código de saída do binário", () => {
  const result = spawnSync(process.execPath, [script, "typescript", "tsc", "--", "--version"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Version \d+\.\d+/);
});

test("repassa o código de saída de falha do binário", () => {
  const result = spawnSync(
    process.execPath,
    [script, "typescript", "tsc", "--", "--opcao-invalida"],
    {
      encoding: "utf8",
    },
  );
  assert.notEqual(result.status, 0);
});
