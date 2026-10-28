import {
  type BackgroundStyle,
  THEME_COLLECTIONS,
  THEME_COLLECTION_IDS,
  THEME_TOKEN_NAMES,
  buildCollectionCss,
} from "@rede-enois/design-system/domain";
import { describe, expect, it } from "vitest";

import { resolveThemeCollection } from "./resolve-theme-collection";

/**
 * O contrato da coleção temática: identificadores estáveis (é o que o backend
 * valida e a conta guarda), cobertura completa de tokens nos dois modos e o
 * fallback que mantém a leitura — tema sem variante escura leva os tokens claros
 * para o seletor `.dark`, e vice-versa.
 */
describe("coleções temáticas", () => {
  it("tem identificadores únicos e os 12 originais preservados (a lista cresce por design)", () => {
    expect(new Set(THEME_COLLECTION_IDS).size).toBe(THEME_COLLECTION_IDS.length);
    for (const original of [
      "win95",
      "win98",
      "win2000",
      "luna",
      "aero-glass",
      "frutiger-aero",
      "metro",
      "terminal",
      "vaporwave",
      "synthwave",
      "y2k",
      "neumorfismo",
    ]) {
      expect(THEME_COLLECTION_IDS, `faltou ${original}`).toContain(original);
    }
  });

  it("cada tema cobre todos os tokens da marca no modo claro e no escuro", () => {
    for (const collection of THEME_COLLECTIONS) {
      const modes = [collection.tokens.light, collection.tokens.dark ?? collection.tokens.light];
      for (const tokens of modes) {
        for (const name of THEME_TOKEN_NAMES) {
          expect(tokens[name], `${collection.id} sem ${name}`).toBeTruthy();
        }
      }
    }
  });

  it("tema só-escuro no modo claro: os tokens escuros valem nos dois modos", () => {
    const terminal = resolveThemeCollection("terminal");
    expect(terminal).not.toBeNull();
    const css = buildCollectionCss(terminal!, "light");
    expect(css).toContain('html:root[data-theme="terminal"]');
    expect(css).toContain("--background: #050805");
    expect(css).toContain("--text-strong: #b8ffc8");
  });

  it("identificador inválido (ou tema removido) resolve para null — nunca um tema pela metade", () => {
    expect(resolveThemeCollection("nope")).toBeNull();
    expect(resolveThemeCollection(null)).toBeNull();
    expect(resolveThemeCollection(undefined)).toBeNull();
  });

  it("CSS estrutural fica escopado no próprio tema, sem vazar para outro", () => {
    for (const collection of THEME_COLLECTIONS) {
      if (!collection.css) continue;
      expect(collection.css).toContain(`data-theme="${collection.id}"`);
      for (const other of THEME_COLLECTIONS) {
        if (other.id === collection.id) continue;
        expect(collection.css, `${collection.id} citando ${other.id}`).not.toContain(
          `data-theme="${other.id}"`,
        );
      }
    }
  });

  it("trocar de tema troca o CSS inteiro — sem recarregamento, o <style> é substituído", () => {
    const metro = buildCollectionCss(resolveThemeCollection("metro")!, "light");
    const terminal = buildCollectionCss(resolveThemeCollection("terminal")!, "light");
    expect(metro).not.toBe(terminal);
    expect(metro).toContain("--radius: 0px");
    expect(terminal).toContain("ui-monospace");
  });

  it("cada tema traz uma amostra representativa para a galeria", () => {
    for (const collection of THEME_COLLECTIONS) {
      expect(collection.name.length).toBeGreaterThan(0);
      expect(collection.description.length).toBeGreaterThan(0);
      expect(collection.preview.background).toBeTruthy();
      expect(collection.preview.surface).toBeTruthy();
      expect(collection.preview.primary).toBeTruthy();
      expect(collection.preview.onPrimary).toBeTruthy();
    }
  });
});

describe("modo claro/escuro com coleção ativa", () => {
  it("tema com variante escura troca o CSS quando o modo muda", () => {
    const metro = resolveThemeCollection("metro")!;
    const light = buildCollectionCss(metro, "light");
    const dark = buildCollectionCss(metro, "dark");
    expect(light).toContain('html:root[data-theme="metro"]');
    expect(light).toContain("--background: #ffffff");
    expect(dark).toContain('html:root.dark[data-theme="metro"]');
    expect(dark).toContain("--background: #171717");
    expect(light).not.toBe(dark);
  });
});

it("todo tema de identidade clara tem variante escura com fundo diferente", () => {
  const claros = ["win95", "win98", "win2000", "luna", "y2k", "neumorfismo"];
  for (const id of claros) {
    const collection = resolveThemeCollection(id);
    expect(collection, id).not.toBeNull();
    expect(collection!.tokens.dark, `${id} sem variante escura`).toBeDefined();
    expect(collection!.tokens.dark!["--background"]).not.toBe(
      collection!.tokens.light["--background"],
    );
  }
});

it("temas escuros por natureza mantêm a mesma cara nos dois modos (de propósito)", () => {
  for (const id of ["terminal", "vaporwave", "synthwave"]) {
    const collection = resolveThemeCollection(id)!;
    const light = buildCollectionCss(collection, "light");
    const dark = buildCollectionCss(collection, "dark");
    const backgroundOf = (css: string) => css.match(/--background: ([^;]+);/)?.[1];
    expect(backgroundOf(light)).toBe(backgroundOf(dark));
  }
});

it("o relevo dos clássicos segue o modo via variável, não cor literal", () => {
  const win95 = resolveThemeCollection("win95")!;
  expect(win95.css).toContain("var(--bevel-light)");
  expect(win95.tokens.light["--bevel-light"]).toBe("#ffffff");
  expect(win95.tokens.dark!["--bevel-light"]).not.toBe("#ffffff");
});

describe("cores livres como camada sobre os temas", () => {
  const accent = { hue: 20, chroma: 0.18, lightness: 0.5 };

  it("a cor livre ajusta o destaque do tema sem tocar em superfícies e relevo", () => {
    const css = buildCollectionCss(resolveThemeCollection("win95")!, "light", { accent });
    expect(css).not.toContain("--primary: #000080"); // destaque do tema sai
    expect(css).toContain("--primary: oklch("); // entra o destaque escolhido
    expect(css).toContain("--background: #c0c0c0"); // superfície do tema fica
    expect(css).toContain("var(--bevel-light)"); // relevo continua lá
  });

  it("sem cor livre, o destaque do tema vale (nada é inventado)", () => {
    const css = buildCollectionCss(resolveThemeCollection("win95")!, "light", { accent: null });
    expect(css).toContain("--primary: #000080");
  });

  it("as camadas de fundo livres não pertencem ao builder do tema: são blocos do apply", () => {
    // Sobre um tema, cor de widget e plano de fundo entram como blocos genéricos
    // de mesma especificidade (apply-theme), então o builder do tema não os recebe.
    const css = buildCollectionCss(resolveThemeCollection("win95")!, "light", { accent });
    expect(css).not.toContain("#0b1220");
  });
});
