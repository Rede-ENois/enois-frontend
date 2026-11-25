import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { BIRTHDAY_CELEBRATION_STICKERS } from "./birthday-stickers";

/**
 * As figurinhas da festa no perfil de aniversariante saem do pacote do repositório
 * (`public/emojis/enois/`), e não do CDN: o arquivo tem de existir no pacote para a figurinha
 * aparecer na festa. Quem decide quando a festa aparece é o perfil; o teste da rota está em
 * `src/routes/perfil.festa-aniversariante.test.tsx`.
 */
describe("figurinhas da festa de aniversário", () => {
  it("são figurinhas do pacote É Nóis que existem no repositório", () => {
    expect(BIRTHDAY_CELEBRATION_STICKERS.length).toBeGreaterThanOrEqual(10);
    for (const src of BIRTHDAY_CELEBRATION_STICKERS) {
      expect(src).toMatch(/^\/emojis\/enois\/[a-z_-]+\.(webp|svg)$/);
      expect(existsSync(new URL(`../../../public${src}`, import.meta.url))).toBe(true);
    }
  });

  it("só entram as felizes: festa, confete, abraço e amigos", () => {
    expect(BIRTHDAY_CELEBRATION_STICKERS).toContain("/emojis/enois/party.webp");
    expect(BIRTHDAY_CELEBRATION_STICKERS).toContain("/emojis/enois/confetti.webp");
    expect(BIRTHDAY_CELEBRATION_STICKERS).toContain("/emojis/enois/hug.webp");
    expect(BIRTHDAY_CELEBRATION_STICKERS).not.toContain("/emojis/enois/rage.webp");
  });

  it("a versão do design system que o lock pede instala e tem o componente da festa", () => {
    const raiz = new URL("../../../", import.meta.url);
    const packageJson = JSON.parse(readFileSync(new URL("package.json", raiz), "utf8"));
    const lock = JSON.parse(readFileSync(new URL("package-lock.json", raiz), "utf8"));
    const pedida = packageJson.dependencies["@rede-enois/design-system"];
    const fixada = lock.packages["node_modules/@rede-enois/design-system"];

    expect(pedida).toMatch(/^\^\d+\.\d+\.\d+$/);
    expect(fixada.version.startsWith(pedida.slice(1).split(".").slice(0, 2).join("."))).toBe(true);
    expect(fixada.resolved).toMatch(
      /^https:\/\/npm\.pkg\.github\.com\/download\/@rede-enois\/design-system\/\d+\.\d+\.\d+\/[0-9a-f]{40}$/,
    );
    expect(fixada.resolved).toContain(`/${fixada.version}/`);
    // A festa nasceu nesta versão: com uma anterior o perfil não compila.
    expect(Number(fixada.version.split(".")[1])).toBeGreaterThanOrEqual(46);
  });
});
