import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { BIRTHDAY_CELEBRATION_STICKERS } from "./birthday-stickers";

/**
 * As figurinhas da festa no perfil de aniversariante saem do pacote do repositório
 * (`public/emojis/enois/`), e não do CDN: o arquivo tem de existir no pacote para a figurinha
 * aparecer na festa. O perfil puxa a festa do design system; o teste lê a rota como texto para
 * não precisar de jsdom, que na máquina de desenvolvimento não abre.
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

  it("o perfil pede a festa só para quem visita e só no dia, com as figurinhas do pacote", () => {
    const perfil = readFileSync(
      new URL("../../routes/perfil.$username.tsx", import.meta.url),
      "utf8",
    );

    expect(perfil).toMatch(
      /import\s*\{[^}]*BirthdayCelebration,[^}]*\}\s*from\s*"@rede-enois\/design-system\/domain"/,
    );
    expect(perfil).toMatch(
      /\{user\.birthdayToday && !isOwnProfile && \(\s*<BirthdayCelebration name=\{user\.name\} stickers=\{BIRTHDAY_CELEBRATION_STICKERS\} \/>/,
    );
  });
});
