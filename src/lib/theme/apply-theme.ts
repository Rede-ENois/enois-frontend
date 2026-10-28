import { texts } from "@/texts";
import {
  type BackgroundStyle,
  PAGE_PAINT_TARGETS,
  type Theme,
  type ThemeSettings,
  WIDGET_PAINT_TARGETS,
  backgroundValue,
  buildCollectionCss,
  buildPageDeclarations,
  buildThemeColor,
  buildThemeCss,
  buildWidgetDeclarations,
  clampThemeSettings,
  isDefaultThemeSettings,
  pageRepresentative,
  paintGradientCss,
} from "@rede-enois/design-system/domain";

import { resolveThemeCollection } from "./resolve-theme-collection";

export const THEME_STYLE_ELEMENT_ID = "app-theme";

/**
 * Chave onde o CSS já resolvido fica guardado.
 *
 * O script que roda antes do primeiro paint só injeta este texto — assim ele não
 * precisa repetir a matemática de cor e não existe flash de tema ao carregar.
 */
export const THEME_CSS_STORAGE_KEY = "connect-grow-theme-css";

/**
 * Identificador da coleção temática ativa, em chave própria para o pré-paint.
 *
 * O CSS estrutural do tema é escopado por `data-theme`, então o atributo precisa
 * existir ANTES do primeiro paint — é o que impede o conteúdo piscar sem o tema.
 */
export const THEME_COLLECTION_STORAGE_KEY = "connect-grow-theme-collection";

/**
 * Aplica o que o usuário escolheu, em camadas: padrão da marca / tema da coleção >
 * cor de destaque livre (com a transparência dela) > cor de widget livre > plano de
 * fundo livre. Coleção inválida (removida, editada à mão) é tratada como ausência —
 * nunca aplica um tema pela metade.
 */
export function applyThemeSettings(
  settings: ThemeSettings,
  mode: Theme,
  collectionId?: string | null,
  widgetBackground?: BackgroundStyle | null,
  pageBackground?: BackgroundStyle | null,
  accentAlpha?: number,
  widgetAlpha?: number | null,
  pageAlpha?: number | null,
): void {
  if (typeof document === "undefined") return;

  const collection = resolveThemeCollection(collectionId);
  // Com um tema da galeria ativo, as cores livres passam a ser CAMADA: o destaque
  // livre pinta por cima da identidade (que mantém superfícies e relevos).
  const accentOverride =
    !collection || isDefaultThemeSettings(settings) ? null : clampThemeSettings(settings).accent;

  // O fundo representativo da página: a camada livre, ou a base do tema/marca — é
  // contra ELE que o texto dos widgets translúcidos é ajustado. `color-mix` entrega
  // cor com alpha; o hex de dentro é o que a matemática de contraste consome.
  const pageBase = pageBackground
    ? pageRepresentative(pageBackground)
    : (collection?.tokens[mode]?.["--background"] ??
      collection?.surfaceHex ??
      (mode === "dark" ? "#141420" : "#ffffff"));
  const pageSolid = pageBase.startsWith("color-mix")
    ? (pageBase.match(/#[0-9a-fA-F]{3,6}/)?.[0] ?? pageBase)
    : pageBase;

  // O atributo é o escopo do CSS estrutural; sem coleção, ele sai de cena junto.
  if (collection) {
    document.documentElement.dataset.theme = collection.id;
  } else {
    delete document.documentElement.dataset.theme;
  }

  const existing = document.getElementById(THEME_STYLE_ELEMENT_ID);

  if (!collection && isDefaultThemeSettings(settings) && !widgetBackground && !pageBackground) {
    existing?.remove();
    localStorage.removeItem(THEME_CSS_STORAGE_KEY);
    localStorage.removeItem(THEME_COLLECTION_STORAGE_KEY);
    updateThemeColorElement(undefined);
    return;
  }

  let css = collection
    ? buildCollectionCss(collection, mode, {
        accent: accentOverride,
        accentAlpha: accentOverride ? accentAlpha : null,
        widgetAlpha: collection && !widgetBackground ? widgetAlpha : null,
        pageAlpha: collection && !pageBackground ? pageAlpha : null,
      })
    : buildThemeCss(settings, mode);

  // Os fundos livres entram no MESMO seletor de especificidade alta dos tokens: um
  // chunk de rota não os desfaz no meio da navegação (lição da camada de cores).
  const selector = mode === "dark" ? "html:root.dark" : "html:root";
  const layers: {
    declarations: Record<string, string>;
    style: BackgroundStyle;
    kind: "widget" | "page";
  }[] = [];
  if (widgetBackground) {
    layers.push({
      declarations: buildWidgetDeclarations(widgetBackground, pageSolid),
      style: widgetBackground,
      kind: "widget",
    });
  }
  if (pageBackground) {
    layers.push({
      declarations: buildPageDeclarations(pageBackground, !collection),
      style: pageBackground,
      kind: "page",
    });
  }
  for (const layer of layers) {
    const block = Object.entries(layer.declarations)
      .map(([name, value]) => `  ${name}: ${value};`)
      .join("\n");
    css += `\n\n${selector} {\n${block}\n}`;
    const paint = paintGradientCss(
      backgroundValue(layer.style),
      selector,
      layer.kind === "page" ? PAGE_PAINT_TARGETS : WIDGET_PAINT_TARGETS,
      layer.kind === "page",
    );
    if (paint) css += `\n${paint}`;
  }

  const style = (existing as HTMLStyleElement | null) ?? document.createElement("style");
  style.id = THEME_STYLE_ELEMENT_ID;
  style.textContent = css;
  if (!existing) document.head.appendChild(style);

  localStorage.setItem(THEME_CSS_STORAGE_KEY, css);
  if (collection) {
    localStorage.setItem(THEME_COLLECTION_STORAGE_KEY, collection.id);
  } else {
    localStorage.removeItem(THEME_COLLECTION_STORAGE_KEY);
  }
  // A barra do navegador acompanha o fundo da página quando ele existe.
  const chromeColor = pageBackground
    ? pageBackground.type === "solid"
      ? pageBackground.color
      : pageBackground.from
    : undefined;
  updateThemeColorElement(
    collection ? collection.metaColor : (chromeColor ?? buildThemeColor(settings, mode)),
  );
}

function updateThemeColorElement(color: string | undefined): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  meta.setAttribute("content", color ?? texts.pwa.themeColor);
}
