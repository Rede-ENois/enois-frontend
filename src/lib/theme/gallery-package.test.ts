import { BRAND_GROUND } from "@/constants/brand-ground";
import { THEME_COLLECTIONS } from "@rede-enois/design-system/domain";
import { describe, expect, it } from "vitest";

import { buildGalleryPackage } from "./gallery-package";

const HEX_ONLY = /^#[0-9a-fA-F]{6}$/;

function parse(packageJson: string) {
  return JSON.parse(packageJson) as {
    palette: {
      background: string;
      surface: string;
      muted: string;
      border: string;
      primary: string;
      onPrimary: string;
      surfaceAlpha?: number;
      text: { strong: string; subtle: string; date: string };
    };
  };
}

/**
 * As cores que o servidor exige sem derivação própria: faltar uma responde 400
 * ("Cor invalida em <campo>") e o tema não chega na galeria.
 */
const REQUIRED_COLORS = [
  "background",
  "surface",
  "muted",
  "border",
  "primary",
  "onPrimary",
] as const;

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

/** Superfície translúcida resolvida sobre o fundo, como o servidor faz antes de medir. */
function over(hex: string, backdrop: string, alpha: number): string {
  if (alpha >= 100) return hex;
  const channel = (value: string, offset: number) =>
    Number.parseInt(value.slice(offset, offset + 2), 16);
  const mixed = [1, 3, 5].map((offset) =>
    Math.round(
      channel(hex, offset) * (alpha / 100) + channel(backdrop, offset) * (1 - alpha / 100),
    ),
  );
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * O gate do `ThemeGalleryService`, inteiro: as cores obrigatórias e os cinco pares de contraste
 * que ele mede. Devolve a lista de recusas — vazia quando o pacote publica.
 *
 * Antes do conserto, `buildGalleryPackage` mandava cinco chaves e o servidor recusava logo na
 * primeira obrigatória que faltava; por isso o contrato mora aqui, e não só no Java.
 */
function recusasDoServidor(packageJson: string): string[] {
  const { palette } = parse(packageJson);
  const recusas: string[] = [];
  for (const field of REQUIRED_COLORS) {
    if (!HEX_ONLY.test(palette[field] ?? "")) recusas.push(`Cor invalida em ${field}.`);
  }
  for (const field of ["strong", "subtle", "date"] as const) {
    if (!HEX_ONLY.test(palette.text?.[field] ?? "")) recusas.push(`Cor invalida em text.${field}.`);
  }
  if (recusas.length > 0) return recusas;

  const surface = over(palette.surface, palette.background, palette.surfaceAlpha ?? 100);
  const pares: [string, string, string][] = [
    [palette.text.strong, palette.background, "texto forte com o fundo"],
    [palette.text.strong, surface, "texto forte com o cartao"],
    [palette.text.strong, palette.muted, "texto forte com o bloco alternativo"],
    [palette.text.subtle, palette.background, "texto secundario com o fundo"],
    [palette.text.subtle, palette.muted, "texto secundario com o bloco alternativo"],
  ];
  for (const [foreground, backdrop, par] of pares) {
    const ratio = contrast(foreground, backdrop);
    if (ratio < 4.5) recusas.push(`contraste do ${par}: ${ratio.toFixed(2)}:1`);
  }
  return recusas;
}

describe("buildGalleryPackage · contrato da galeria", () => {
  it("o pacote de uma personalização livre publica (era o 400 em muted)", () => {
    const { packageJson } = buildGalleryPackage({
      collectionId: null,
      settings: {
        accent: { hue: 265.5, chroma: 0.134, lightness: 0.578 },
        background: { hue: 229.75, chroma: 0.029 },
      },
      mode: "dark",
      widget: {
        type: "gradient",
        color: "#0b2942",
        alpha: 100,
        from: "#0e2d49",
        fromAlpha: 100,
        to: "#092339",
        toAlpha: 100,
        direction: "diagonal",
        angle: 135,
      },
      page: {
        type: "solid",
        color: "#011627",
        alpha: 100,
        from: "#011627",
        fromAlpha: 100,
        to: "#011627",
        toAlpha: 100,
        direction: "diagonal",
        angle: 135,
      },
    });

    expect(recusasDoServidor(packageJson)).toEqual([]);
    const { palette } = parse(packageJson);
    // A cor de widget vira o cartão: sem isso o tema vendido saía com tudo na cor do fundo.
    expect(palette.surface).not.toBe(palette.background);
    expect(palette.border).not.toBe(palette.background);
  });

  it("toda coleção da casa publica, nos dois modos", () => {
    for (const collection of THEME_COLLECTIONS) {
      for (const mode of ["light", "dark"] as const) {
        const { packageJson } = buildGalleryPackage({
          collectionId: collection.id,
          settings: {
            accent: { hue: 262, chroma: 0.2, lightness: 0.6 },
            background: { hue: 262, chroma: 0.02 },
          },
          mode,
        });
        expect(recusasDoServidor(packageJson), `${collection.id} (${mode})`).toEqual([]);
      }
    }
  });

  it("publica em toda combinação de coleção, modo, widget e plano de fundo", () => {
    // A varredura que achou o 400 do publish: um plano de fundo livre pode inverter a família de
    // cor da coleção (tema claro com plano escuro), e o widget translúcido puxa a superfície para
    // o lado oposto do fundo. Cada combinação tem de publicar.
    const widgetBrancoTranslucido = {
      type: "solid" as const,
      color: "#ffffff",
      alpha: 22,
      from: "#ffffff",
      fromAlpha: 22,
      to: "#ffffff",
      toAlpha: 22,
      direction: "diagonal" as const,
      angle: 135,
    };
    const paginaEscura = {
      type: "solid" as const,
      color: "#011627",
      alpha: 100,
      from: "#011627",
      fromAlpha: 100,
      to: "#011627",
      toAlpha: 100,
      direction: "diagonal" as const,
      angle: 135,
    };

    const recusas: string[] = [];
    for (const collection of THEME_COLLECTIONS) {
      for (const mode of ["light", "dark"] as const) {
        for (const widget of [null, widgetBrancoTranslucido]) {
          for (const page of [null, paginaEscura]) {
            const where = `${collection.id} (${mode})${widget ? " + widget" : ""}${page ? " + pagina" : ""}`;
            const { packageJson } = buildGalleryPackage({
              collectionId: collection.id,
              settings: {
                accent: { hue: 262, chroma: 0.2, lightness: 0.6 },
                background: { hue: 262, chroma: 0.02 },
              },
              mode,
              widget,
              page,
            });
            for (const recusa of recusasDoServidor(packageJson)) {
              recusas.push(`${where}: ${recusa}`);
            }
          }
        }
      }
    }
    expect(recusas).toEqual([]);
  });

  it("o cartão continua desenhado no fundo e o bloco alternativo não repete a superfície", () => {
    // Fora do gate do servidor, mas é o que a pessoa vê: borda apagada = tema chapado, e bloco
    // alternativo igual à superfície = navegação sem degrau.
    const paginaEscura = {
      type: "solid" as const,
      color: "#011627",
      alpha: 100,
      from: "#011627",
      fromAlpha: 100,
      to: "#011627",
      toAlpha: 100,
      direction: "diagonal" as const,
      angle: 135,
    };

    const problemas: string[] = [];
    for (const collection of THEME_COLLECTIONS) {
      for (const mode of ["light", "dark"] as const) {
        for (const page of [null, paginaEscura]) {
          const where = `${collection.id} (${mode})${page ? " + pagina" : ""}`;
          const { packageJson } = buildGalleryPackage({
            collectionId: collection.id,
            settings: {
              accent: { hue: 262, chroma: 0.2, lightness: 0.6 },
              background: { hue: 262, chroma: 0.02 },
            },
            mode,
            page,
          });
          const { palette } = parse(packageJson);
          const surface = over(palette.surface, palette.background, palette.surfaceAlpha ?? 100);
          const borderVsBackground = contrast(palette.border, palette.background);
          const borderVsMuted = contrast(palette.border, palette.muted);
          if (borderVsBackground < 3) {
            problemas.push(`${where}: borda x fundo ${borderVsBackground.toFixed(2)}:1`);
          }
          if (borderVsMuted < 3) {
            problemas.push(`${where}: borda x bloco ${borderVsMuted.toFixed(2)}:1`);
          }
          if (palette.muted === palette.background || palette.muted === surface) {
            problemas.push(`${where}: bloco alternativo repetindo superficie`);
          }
        }
      }
    }
    expect(problemas).toEqual([]);
  });

  it("widget translúcido viaja com o alpha, e o texto é medido já composto", () => {
    const { packageJson } = buildGalleryPackage({
      collectionId: null,
      settings: {
        accent: { hue: 283, chroma: 0.244, lightness: 0.544 },
        background: { hue: 285, chroma: 0.03 },
      },
      mode: "dark",
      widget: {
        type: "gradient",
        color: "#f3efff",
        alpha: 22,
        from: "#f3efff",
        fromAlpha: 22,
        to: "#b9a6ff",
        toAlpha: 14,
        direction: "diagonal",
        angle: 135,
      },
      page: {
        type: "gradient",
        color: "#2e1762",
        alpha: 100,
        from: "#4a2396",
        fromAlpha: 100,
        to: "#120a2e",
        toAlpha: 100,
        direction: "radial",
        angle: 135,
      },
    });

    const { palette } = parse(packageJson);
    expect(palette.surfaceAlpha).toBe(18);
    expect(recusasDoServidor(packageJson)).toEqual([]);
  });
});

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
    expect(palette.background).not.toBe(BRAND_GROUND.dark);
  });

  it("qualquer plano de fundo livre publica, inclusive a faixa de luminância média", () => {
    // A varredura de cima só troca o widget e a página, e aí o fundo é sempre o da coleção. Com um
    // plano de fundo livre a pessoa escolhe a cor do fundo, e a faixa do meio é a que dói: o texto
    // forte passa raspando no fundo mas não no cartão composto sobre ele. Era ali que o pacote
    // saía recusado (`#707070` dava 4,24:1 no par de texto forte com o cartão).
    const solidPage = (color: string) => ({
      type: "solid" as const,
      color,
      alpha: 100,
      from: color,
      fromAlpha: 100,
      to: color,
      toAlpha: 100,
      direction: "diagonal" as const,
      angle: 135,
    });
    const hsl = (hue: number, saturation: number, lightness: number): string => {
      const chroma = (saturation / 100) * Math.min(lightness / 100, 1 - lightness / 100);
      const channel = (offset: number) => {
        const k = (offset + hue / 30) % 12;
        const value = lightness / 100 - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(value * 255)
          .toString(16)
          .padStart(2, "0");
      };
      return `#${channel(0)}${channel(8)}${channel(4)}`;
    };
    const backgrounds = [
      "#707070",
      "#737373",
      "#367d36",
      ...Array.from({ length: 720 }, (_, index) => {
        const hue = (index % 6) * 60;
        const saturation = [30, 70][Math.floor(index / 6) % 2];
        const lightness = [25, 40, 55, 70, 85][Math.floor(index / 12) % 5];
        return hsl(hue, saturation, lightness);
      }),
    ];

    const recusas: string[] = [];
    for (const collection of THEME_COLLECTIONS) {
      for (const mode of ["light", "dark"] as const) {
        for (const color of new Set(backgrounds)) {
          const { packageJson } = buildGalleryPackage({
            collectionId: collection.id,
            settings: {
              accent: { hue: 262, chroma: 0.2, lightness: 0.6 },
              background: { hue: 262, chroma: 0.02 },
            },
            mode,
            page: solidPage(color),
          });
          for (const recusa of recusasDoServidor(packageJson)) {
            recusas.push(`${collection.id} (${mode}) fundo ${color}: ${recusa}`);
          }
        }
      }
    }
    expect(recusas).toEqual([]);
  }, 60_000);

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
    expect(light.background).toBe(BRAND_GROUND.light);
    expect(light.text.strong).toBe("#111111");
  });
});
