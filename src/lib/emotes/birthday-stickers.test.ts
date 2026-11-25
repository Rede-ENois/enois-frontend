import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { BIRTHDAY_CELEBRATION_STICKERS } from "./birthday-stickers";

/**
 * As figurinhas da festa no perfil de aniversariante saem do pacote do repositório
 * (`public/emojis/enois/`), e não do CDN: o arquivo tem de existir no pacote para a figurinha
 * aparecer na festa.
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
});
