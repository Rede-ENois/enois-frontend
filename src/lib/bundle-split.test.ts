// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * O chunk de entrada do app e o da casca (`src/routes/__root.tsx`). Tudo que ela importa
 * estaticamente e baixado por TODO visitante, inclusive quem nunca entra e quem nunca abre uma
 * conversa.
 *
 * A criptografia ponta a ponta (RSA-OAEP + PBKDF2 + o IndexedDB das chaves) estava nesse caminho
 * porque a casca montava o dock de mensagens direto (`__root` → `chat-dock` → `key-manager`/
 * `conversation` → `crypto`). Com dezenas de KB baixados a toa, o primeiro paint em rede movel
 * paga por uma tela que talvez nunca apareca.
 *
 * Este teste fixa o contrato: o modulo de criptografia NAO pode ser alcancavel por import
 * estatico a partir da casca. Ele pode ser carregado sob demanda (import dinamico), o que e o
 * caminho certo para quem so abre o dock depois de logar.
 */
const SRC = fileURLToPath(new URL("../", import.meta.url));

function tryFile(base: string): string | null {
  for (const suffix of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const candidate = base + suffix;
    if (existsSync(candidate) && statSync(candidate).isFile() && !candidate.endsWith(".d.ts")) {
      return candidate;
    }
  }
  return null;
}

function resolveSpecifier(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return tryFile(join(SRC, specifier.slice(2)));
  if (specifier.startsWith(".")) return tryFile(resolve(dirname(fromFile), specifier));
  return null;
}

const STATIC_FROM = /(^|\n)\s*(?:import|export)\s+(?!type\b)([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
const STATIC_SIDE_EFFECT = /(^|\n)\s*import\s+["']([^"']+)["']/g;

/** Arestas de import ESTATICO (as so com `import type` nao existem em runtime). */
function staticImports(file: string): string[] {
  // Comentarios saem primeiro: um `import ... from` citado num comentario nao e um import.
  const source = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const found = new Set<string>();

  for (const match of source.matchAll(STATIC_FROM)) {
    if (/^\s*type\s/.test(match[2])) continue;
    const resolved = resolveSpecifier(file, match[3]);
    if (resolved) found.add(resolved);
  }
  for (const match of source.matchAll(STATIC_SIDE_EFFECT)) {
    const resolved = resolveSpecifier(file, match[2]);
    if (resolved) found.add(resolved);
  }
  return [...found];
}

/** Arquivos alcancaveis por import estatico a partir de `entry`, sem sair de `src/`. */
function staticReachability(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const next of staticImports(file)) {
      if (!seen.has(next)) queue.push(next);
    }
  }
  return seen;
}

describe("casca do app — o que o visitante baixa", () => {
  const shell = join(SRC, "routes/__root.tsx");

  it("nao arrasta o modulo de criptografia E2E para o chunk de entrada", () => {
    const reachable = staticReachability(shell);
    const crypto = join(SRC, "lib/e2e/crypto.ts");

    expect(reachable.has(crypto)).toBe(false);
  });

  it("nao arrasta o gerenciador de chaves nem a cifra de mensagens", () => {
    const reachable = staticReachability(shell);

    expect(reachable.has(join(SRC, "lib/e2e/key-manager.ts"))).toBe(false);
    expect(reachable.has(join(SRC, "lib/e2e/conversation.ts"))).toBe(false);
  });

  it("carrega o dock sob demanda, e nao no import da casca", () => {
    const reachable = staticReachability(shell);
    const dock = join(SRC, "components/chat-dock/chat-dock.tsx");
    const mount = join(SRC, "components/chat-dock/chat-dock-mount.tsx");

    // O ponto de montagem entra no caminho estatico (e barato); o dock, nao.
    expect(reachable.has(mount)).toBe(true);
    expect(reachable.has(dock)).toBe(false);
  });

  it("o ponto de montagem pede o dock por import dinamico", () => {
    const mount = readFileSync(join(SRC, "components/chat-dock/chat-dock-mount.tsx"), "utf8");

    // `lazy(() => import(...))`: sem o import dinamico a aresta volta a ser estatica e o teste
    // acima deixa de valer por acidente.
    expect(mount).toMatch(/lazy\(\s*\(\)\s*=>\s*import\(/);
  });
});
