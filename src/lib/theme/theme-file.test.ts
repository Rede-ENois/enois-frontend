import { type BackgroundStyle, DEFAULT_THEME_SETTINGS } from "@rede-enois/design-system/domain";
import { describe, expect, it } from "vitest";

import { buildThemeFile, parseThemeFile } from "./theme-file";

const WIDGET: BackgroundStyle = {
  type: "solid",
  color: "#101020",
  alpha: 80,
  from: "#101020",
  fromAlpha: 80,
  to: "#101020",
  toAlpha: 80,
  direction: "diagonal",
  angle: 135,
};

const PAGE: BackgroundStyle = {
  type: "gradient",
  color: "#ffffff",
  alpha: 100,
  from: "#ff00aa",
  fromAlpha: 90,
  to: "#2200ff",
  toAlpha: 40,
  direction: "custom",
  angle: 45,
};

describe("arquivo de tema", () => {
  it("monta e lê de volta o que foi montado", () => {
    const text = buildThemeFile({
      collection: null,
      settings: DEFAULT_THEME_SETTINGS,
      name: "Meu tema",
    });
    const result = parseThemeFile(text);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.name).toBe("Meu tema");
    expect(result.file.settings).toEqual(DEFAULT_THEME_SETTINGS);
    expect(result.file.version).toBe(1);
  });

  it("guarda a coleção por referência e recusa coleção desconhecida", () => {
    const comColecao = parseThemeFile(
      buildThemeFile({ collection: null, settings: DEFAULT_THEME_SETTINGS }),
    );
    expect(comColecao.ok).toBe(true);

    const inventada = parseThemeFile(
      JSON.stringify({
        format: "enois-theme",
        version: 1,
        collection: "tema-que-nao-existe",
        settings: DEFAULT_THEME_SETTINGS,
      }),
    );
    expect(inventada).toEqual({ ok: false, reason: "collection" });
  });

  it("recusa o que não é arquivo de tema", () => {
    expect(parseThemeFile("nao sou json")).toEqual({ ok: false, reason: "json" });
    expect(parseThemeFile('{"qualquer":"coisa"}')).toEqual({ ok: false, reason: "format" });
    expect(
      parseThemeFile(JSON.stringify({ format: "enois-theme", version: 99, settings: {} })),
    ).toEqual({
      ok: false,
      reason: "version",
    });
    expect(
      parseThemeFile(
        JSON.stringify({ format: "enois-theme", version: 1, settings: { accent: {} } }),
      ),
    ).toEqual({ ok: false, reason: "settings" });
  });

  it("ajusta números fora da faixa em vez de aceitar cor impossível", () => {
    const result = parseThemeFile(
      JSON.stringify({
        format: "enois-theme",
        version: 1,
        collection: null,
        settings: {
          accent: { hue: 9999, chroma: 5, lightness: -3 },
          background: { hue: -720, chroma: 99 },
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.settings.accent.hue).toBeGreaterThanOrEqual(0);
    expect(result.file.settings.accent.hue).toBeLessThanOrEqual(360);
    expect(result.file.settings.accent.chroma).toBeLessThanOrEqual(1);
    expect(result.file.settings.accent.lightness).toBeGreaterThanOrEqual(0);
    expect(result.file.settings.background.chroma).toBeLessThanOrEqual(1);
  });

  it("leva os fundos livres junto (senão o tema importado sai pela metade)", () => {
    const result = parseThemeFile(
      buildThemeFile({
        collection: "win95",
        settings: DEFAULT_THEME_SETTINGS,
        widget: WIDGET,
        page: PAGE,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.collection).toBe("win95");
    expect(result.file.widget).toEqual(WIDGET);
    expect(result.file.page).toEqual(PAGE);
  });

  it("arquivo sem fundo não inventa fundo", () => {
    const result = parseThemeFile(
      buildThemeFile({ collection: null, settings: DEFAULT_THEME_SETTINGS }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.widget).toBeUndefined();
    expect(result.file.page).toBeUndefined();
  });

  it("recusa fundo torto em vez de aplicar meio tema", () => {
    const base = {
      format: "enois-theme",
      version: 1,
      collection: null,
      settings: DEFAULT_THEME_SETTINGS,
    };

    expect(
      parseThemeFile(JSON.stringify({ ...base, widget: { type: "solid", color: "vermelho" } })),
    ).toEqual({ ok: false, reason: "background" });
    expect(parseThemeFile(JSON.stringify({ ...base, page: "gradiente" }))).toEqual({
      ok: false,
      reason: "background",
    });
  });

  it("ajusta números fora da faixa no fundo, como faz com as cores", () => {
    const result = parseThemeFile(
      JSON.stringify({
        format: "enois-theme",
        version: 1,
        collection: null,
        settings: DEFAULT_THEME_SETTINGS,
        widget: { ...WIDGET, alpha: 999, angle: -30, direction: "inventada" },
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.widget?.alpha).toBe(100);
    expect(result.file.widget?.angle).toBe(0);
    expect(result.file.widget?.direction).toBe("diagonal");
  });

  it("aceita arquivo sem nome (nome é enfeite)", () => {
    const semNome = parseThemeFile(
      JSON.stringify({
        format: "enois-theme",
        version: 1,
        collection: null,
        settings: DEFAULT_THEME_SETTINGS,
      }),
    );
    expect(semNome.ok).toBe(true);
    if (!semNome.ok) return;
    expect(semNome.file.name).toBeUndefined();
  });
});
