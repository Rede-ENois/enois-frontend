import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { texts } from "./texts";

/**
 * O manifesto do PWA é o arquivo que o navegador lê para montar o pedido de instalação do app.
 *
 * Em 2026-10-21 o mesmo endereço (/manifest.webmanifest) tinha DOIS donos: o arquivo estatico
 * em `public/` e a rota `src/routes/manifest[.]webmanifest.ts`. O estatico ganha (o servidor
 * responde os arquivos de `public/` antes de chegar na rota), entao a rota era codigo morto: o
 * texto novo que la se escrevesse nunca chegava no navegador, e era exatamente onde a frase
 * antiga "rede profissional" sobrevivia. A rota foi apagada e o arquivo estatico virou o dono
 * unico — este teste existe para ele nao voltar a divergir do `texts.ts` nem dos icones que o
 * proprio manifesto aponta.
 */

const MANIFEST_PATH = fileURLToPath(new URL("../public/manifest.webmanifest", import.meta.url));
const PUBLICO = fileURLToPath(new URL("../public", import.meta.url));

function manifest(): Record<string, unknown> {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Record<string, unknown>;
}

describe("manifesto do PWA", () => {
  it("e um JSON valido", () => {
    expect(() => manifest()).not.toThrow();
  });

  it("usa a mesma descricao do texts.ts (a copia mora em um lugar so)", () => {
    expect(manifest().description).toBe(texts.pwa.manifestDescription);
  });

  it("nao chama o Enois de rede profissional", () => {
    expect(String(manifest().description)).not.toMatch(/rede profissional/i);
  });

  it("aponta para icones que existem no disco", () => {
    const icones = manifest().icons as { src: string }[];
    expect(icones.length).toBeGreaterThan(0);
    for (const icone of icones) {
      expect(existsSync(`${PUBLICO}${icone.src}`), `icone ausente: ${icone.src}`).toBe(true);
    }
  });

  it("declara os icones no tamanho que o nome do arquivo promete", () => {
    const icones = manifest().icons as { src: string; sizes: string }[];
    for (const icone of icones) {
      const tamanho = Number.parseInt(icone.sizes, 10);
      const nome = icone.src.split("/").pop() ?? "";
      const doNome = Number.parseInt(nome.match(/(\d+)\.png$/)?.[1] ?? "0", 10);
      expect(doNome).toBe(tamanho);
    }
  });

  it("nao deixa o manifesto para tras da cor de fundo do app", () => {
    // O fundo da pagina e o token --background (src/styles.css). O splash do app tem que abrir
    // na mesma cor, senao o PWAInstalled pisca branco na hora de abrir.
    const estilo = readFileSync(fileURLToPath(new URL("./styles.css", import.meta.url)), "utf8");
    const fundo = estilo.match(/--background:\s*(#[0-9a-f]{6})/i)?.[1];
    expect(fundo).toBeTruthy();
    expect(String(manifest().background_color).toLowerCase()).toBe(fundo?.toLowerCase());
  });
});
