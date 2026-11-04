import assert from "node:assert/strict";
import { test } from "node:test";

import { parsePreviewArgs } from "./preview.mjs";

test("usa a porta 4173 e faz o build por padrão", () => {
  assert.deepEqual(parsePreviewArgs([]), { port: "4173", build: true });
});

test("aceita outra porta e pular o build", () => {
  assert.deepEqual(parsePreviewArgs(["--port", "5000", "--no-build"]), {
    port: "5000",
    build: false,
  });
});

test("recusa porta ausente ou não numérica", () => {
  assert.throws(() => parsePreviewArgs(["--port"]), /porta inválida/);
  assert.throws(() => parsePreviewArgs(["--port", "abc"]), /porta inválida/);
});
