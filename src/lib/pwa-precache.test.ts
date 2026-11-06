import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * `cache.addAll` do service worker é tudo ou nada: um caminho do `PRECACHE` que não existe no build
 * rejeita a instalação inteira, o app fica sem cache offline e sem push — e nada fica vermelho.
 *
 * Este teste gera os arquivos de `public/` (o resto do precache — chunks com hash, manifest — nasce
 * do build) e confere cada caminho estático.
 */
const PUBLIC = fileURLToPath(new URL("../../public/", import.meta.url));

function precachePaths(): string[] {
  const sw = readFileSync(`${PUBLIC}sw.js`, "utf8");
  const bloco = sw.match(/const PRECACHE = \[([\s\S]*?)\];/)?.[1];
  if (!bloco) throw new Error("PRECACHE não encontrado em public/sw.js");
  return [...bloco.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function existeNoPublic(caminho: string): boolean {
  return readdirSync(PUBLIC, { recursive: true }).some(
    (arquivo) => `/${String(arquivo)}` === caminho,
  );
}

describe("public/sw.js — precache", () => {
  it("só precacheia arquivos que existem em public/", () => {
    const faltando = precachePaths().filter((caminho) => !existeNoPublic(caminho));
    expect(faltando).toEqual([]);
  });
});
