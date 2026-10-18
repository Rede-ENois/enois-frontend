import { DEFAULT_THEME_SETTINGS } from "@/constants/theme-defaults";
import { describe, expect, it } from "vitest";

import { buildThemeFile, parseThemeFile } from "./theme-file";

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
