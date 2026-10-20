import type { BackgroundStyle } from "@/types/preferences/background-style";
import { describe, expect, it } from "vitest";

import {
  PAGE_PAINT_TARGETS,
  WIDGET_PAINT_TARGETS,
  backgroundValue,
  buildPageDeclarations,
  buildWidgetDeclarations,
  paintGradientCss,
} from "./build-background-style";
import { hexToHsl, hexToRgb, hslToHex, readableForeground } from "./color";

const solidDark: BackgroundStyle = {
  type: "solid",
  color: "#0b1220",
  alpha: 100,
  from: "#0b1220",
  fromAlpha: 100,
  to: "#0b1220",
  toAlpha: 100,
  direction: "diagonal",
  angle: 135,
};

const solidLight: BackgroundStyle = { ...solidDark, color: "#f4f1fb" };

/**
 * O fundo escolhido é dono da leitura: qualquer que seja a cor, o texto aplicado
 * sobre ela tem que passar do piso de leitura — é isso que estes testes travam.
 */
describe("plano de fundo personalizado", () => {
  it("fundo escuro escolhido vira texto claro", () => {
    const declarations = buildWidgetDeclarations(solidDark, "#ffffff");
    const expected = readableForeground(hexToRgb("#0b1220"), 290).css;
    expect(declarations["--foreground"]).toBe(expected);
    expect(declarations["--foreground"]).toContain("0.99");
  });

  it("fundo claro escolhido mantém texto escuro", () => {
    const declarations = buildWidgetDeclarations(solidLight, "#ffffff");
    expect(declarations["--foreground"]).toBe(readableForeground(hexToRgb("#f4f1fb"), 290).css);
    expect(declarations["--foreground"]).toContain("0.16");
  });

  it("a cor sólida escolhida é o próprio widget (não o gradiente padrão)", () => {
    const declarations = buildWidgetDeclarations(solidDark, "#ffffff");
    expect(declarations["--card"]).toBe("#0b1220");
    expect(declarations["--surface-card"]).toBe("#0b1220");
    expect(declarations["--card"]).not.toContain("gradient");
  });

  it("o plano de fundo da página troca só o --background, sem tocar em texto", () => {
    const declarations = buildPageDeclarations(solidDark);
    expect(declarations).toEqual({ "--background": "#0b1220" });
  });

  it("gradiente usa a direção pedida e o texto se apoia no ponto médio", () => {
    const gradient: BackgroundStyle = {
      type: "gradient",
      color: "#f4f1fb",
      alpha: 100,
      from: "#1a1030",
      fromAlpha: 100,
      to: "#e6dcf7",
      toAlpha: 100,
      direction: "vertical",
      angle: 135,
    };
    expect(backgroundValue(gradient)).toContain("linear-gradient(180deg, #1a1030, #e6dcf7)");

    const declarations = buildWidgetDeclarations(gradient, "#808690");
    expect(declarations["--foreground"]).toBe(readableForeground(hexToRgb("#808690"), 290).css);
    expect(declarations["--text-subtle"]).toContain("color-mix");
  });

  it("direções viram o CSS esperado, inclusive o ângulo livre", () => {
    const diagonal: BackgroundStyle = { ...solidDark, type: "gradient", direction: "diagonal" };
    expect(backgroundValue(diagonal)).toContain("linear-gradient(135deg");
    expect(backgroundValue({ ...diagonal, direction: "radial" })).toContain("radial-gradient");
    expect(backgroundValue({ ...diagonal, direction: "custom", angle: 45 })).toContain(
      "linear-gradient(45deg",
    );
    expect(backgroundValue({ ...diagonal, direction: "horizontal" })).toContain(
      "linear-gradient(90deg",
    );
  });
});

describe("transparência por camada", () => {
  it("cor sólida com alpha vira color-mix e o texto é ajustado contra a cor efetiva", () => {
    const translucent: BackgroundStyle = { ...solidDark, alpha: 40 };
    const widget = buildWidgetDeclarations(translucent, "#ffffff");
    expect(widget["--card"]).toContain("color-mix(in srgb, #0b1220 40%");
    expect(widget["--foreground"]).toBeTruthy();
  });

  it("gradiente com transparência por ponta (o vidro que vai de um alpha a outro)", () => {
    const glass: BackgroundStyle = {
      ...solidDark,
      type: "gradient",
      from: "#1a1030",
      to: "#e6dcf7",
      fromAlpha: 30,
      toAlpha: 90,
      direction: "vertical",
    };
    const value = backgroundValue(glass);
    expect(value).toContain("color-mix(in srgb, #1a1030 30%, transparent)");
    expect(value).toContain("color-mix(in srgb, #e6dcf7 90%, transparent)");
  });

  it("alpha 100 emite a cor pura, sem color-mix", () => {
    expect(backgroundValue(solidDark)).toBe("#0b1220");
  });
});

describe("pintura de gradiente (background-image)", () => {
  const gradient: BackgroundStyle = {
    ...solidDark,
    type: "gradient",
    from: "#f9f8ff",
    to: "#e6dcf7",
    direction: "vertical",
  };
  const value = backgroundValue(gradient);

  it("gradiente pinta por background-image nos utilitários da página, ancorado na viewport", () => {
    const css = paintGradientCss(value, "html:root", PAGE_PAINT_TARGETS, true);
    expect(css).toContain("background-image: linear-gradient(180deg");
    expect(css).toContain(".bg-background, body");
    expect(css).toContain("background-attachment: fixed");
  });

  it("cor de widget em degradê pinta os utilitários das superfícies, por elemento", () => {
    const css = paintGradientCss(value, "html:root", WIDGET_PAINT_TARGETS, false);
    expect(css).toContain(".bg-card, .bg-popover, .bg-surface-card, .bg-sidebar, .surface-card");
    expect(css).not.toContain("background-attachment");
  });

  it("fundo sólido não gera pintura (funciona pelo token, como cor)", () => {
    expect(paintGradientCss("#0b1220", "html:root", PAGE_PAINT_TARGETS, true)).toBe("");
  });
});

describe("conversões HSL dos sliders de fundo", () => {
  it("hsl e hex conversam nos dois sentidos (dentro da quantização de 8 bits)", () => {
    for (const hex of ["#0b1220", "#f4f1fb", "#ff71ce", "#000000", "#ffffff"]) {
      const { h, s, l } = hexToHsl(hex);
      const back = hexToHsl(hslToHex(h, s, l));
      const circular = Math.min(Math.abs(back.h - h), 360 - Math.abs(back.h - h));
      expect(circular).toBeLessThanOrEqual(2);
      expect(Math.abs(back.s - s)).toBeLessThanOrEqual(6);
      expect(Math.abs(back.l - l)).toBeLessThanOrEqual(6);
    }
  });
});
