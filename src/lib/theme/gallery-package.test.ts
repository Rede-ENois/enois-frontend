import { THEME_COLLECTIONS } from "@rede-enois/design-system/domain";
import { describe, expect, it } from "vitest";

import { buildGalleryPackage } from "./gallery-package";

const HEX_ONLY = /^#[0-9a-fA-F]{6}$/;

function parse(packageJson: string) {
  return JSON.parse(packageJson) as {
    palette: {
      background: string;
      surface: string;
      border: string;
      primary: string;
      text: { strong: string; subtle: string };
    };
  };
}

/** Contraste WCAG entre dois hex (o mesmo gate que a galeria aplica no publish). */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const channel = (offset: number) => {
      const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  };
  const first = lum(a);
  const second = lum(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe("buildGalleryPackage", () => {
  it("transforma a coleção ativa num pacote de cores válido", () => {
    const collection = THEME_COLLECTIONS[0];

    for (const mode of ["light", "dark"] as const) {
      const { modeDefault, packageJson } = buildGalleryPackage({
        collectionId: collection.id,
        settings: {
          accent: { hue: 262, chroma: 0.2, lightness: 0.6 },
          background: { hue: 262, chroma: 0.02 },
        },
        mode,
      });

      expect(modeDefault).toBe(mode);
      const palette = parse(packageJson).palette;
      for (const value of [
        palette.background,
        palette.surface,
        palette.border,
        palette.primary,
        palette.text.strong,
        palette.text.subtle,
      ]) {
        expect(value).toMatch(HEX_ONLY);
      }
      // O gate da galeria (texto × fundo) precisa passar — senão o publish responderia 400.
      expect(contrast(palette.text.strong, palette.background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("usa o fundo de página livre como fundo do pacote", () => {
    const { packageJson } = buildGalleryPackage({
      collectionId: null,
      settings: {
        accent: { hue: 200, chroma: 0.15, lightness: 0.55 },
        background: { hue: 200, chroma: 0.02 },
      },
      mode: "dark",
      page: {
        type: "gradient",
        color: "#101a2b",
        alpha: 100,
        from: "#101a2b",
        fromAlpha: 100,
        to: "#2a1030",
        toAlpha: 100,
        direction: "custom",
        angle: 135,
      },
    });

    const palette = parse(packageJson).palette;
    expect(palette.background).toMatch(HEX_ONLY);
    expect(palette.background).not.toBe("#141420");
  });

  it("sem coleção, cai nos tons da marca do modo atual", () => {
    const light = parse(
      buildGalleryPackage({
        collectionId: null,
        settings: {
          accent: { hue: 262, chroma: 0.2, lightness: 0.6 },
          background: { hue: 262, chroma: 0.02 },
        },
        mode: "light",
      }).packageJson,
    ).palette;
    expect(light.background).toBe("#ffffff");
    expect(light.text.strong).toBe("#111111");
  });
});
