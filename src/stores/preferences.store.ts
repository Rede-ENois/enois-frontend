import type { ProfileNameTheme } from "@/types/application/cosmetics/profile-name-theme";
import type { PreferencesState } from "@/types/stores/preferences-state";
import type { PreferencesStorageValue } from "@/types/stores/preferences-storage-value";
import {
  DEFAULT_THEME_SETTINGS,
  PROFILE_NAME_FONTS,
  PROFILE_NAME_THEMES,
  clampThemeSettings,
} from "@rede-enois/design-system/domain";
import type { BackgroundStyle, Theme, ThemeSettings } from "@rede-enois/design-system/domain";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { resolveThemeCollection } from "@/lib/theme/resolve-theme-collection";

const PREFERENCES_STORAGE_KEY = "connect-grow-preferences";
const LEGACY_THEME_STORAGE_KEY = "connect-grow-theme";
const LEGACY_SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

function readNumber(source: Record<string, unknown>, key: string, fallback: number): number {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Traz o tema salvo de volta para uma forma válida.
 *
 * O storage é editável à mão e sobrevive a versões antigas do app, então nada
 * aqui pode confiar no formato: valores fora das faixas seguras são corrigidos.
 */
function normalizeThemeSettings(value: unknown): ThemeSettings {
  if (typeof value !== "object" || value === null) return DEFAULT_THEME_SETTINGS;

  const settings = value as Record<string, unknown>;
  const accent = (settings.accent ?? {}) as Record<string, unknown>;
  const background = (settings.background ?? {}) as Record<string, unknown>;

  return clampThemeSettings({
    accent: {
      hue: readNumber(accent, "hue", DEFAULT_THEME_SETTINGS.accent.hue),
      chroma: readNumber(accent, "chroma", DEFAULT_THEME_SETTINGS.accent.chroma),
      lightness: readNumber(accent, "lightness", DEFAULT_THEME_SETTINGS.accent.lightness),
    },
    background: {
      hue: readNumber(background, "hue", DEFAULT_THEME_SETTINGS.background.hue),
      chroma: readNumber(background, "chroma", DEFAULT_THEME_SETTINGS.background.chroma),
    },
  });
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const BACKGROUND_DEFAULTS = { color: "#f4f1fb", from: "#f9f8ff", to: "#e6dcf7" } as const;
// As listas vêm da fonte única (constants): tema ou fonte nova não pode ser descartada ao
// recarregar a preferência salva.
const NAME_FONTS = new Set<string>(Object.keys(PROFILE_NAME_FONTS));
const NAME_THEMES = new Set<string>(Object.keys(PROFILE_NAME_THEMES));

function normalizeNameFont(value: unknown): PreferencesState["displayNameFont"] {
  return typeof value === "string" && NAME_FONTS.has(value)
    ? (value as PreferencesState["displayNameFont"])
    : null;
}

function normalizeNameColor(value: unknown): string | null {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

function normalizeNameTheme(value: unknown): PreferencesState["displayNameTheme"] {
  return typeof value === "string" && NAME_THEMES.has(value) ? (value as ProfileNameTheme) : null;
}

/**
 * Plano de fundo do storage: tipo e direção válidos, cores hex; qualquer coisa
 * estranha no localStorage volta a `null` (comportamento automático).
 */
function normalizeBackgroundStyle(value: unknown): BackgroundStyle | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const type = raw.type === "solid" || raw.type === "gradient" ? raw.type : null;
  if (!type) return null;
  const direction =
    raw.direction === "vertical" ||
    raw.direction === "radial" ||
    raw.direction === "horizontal" ||
    raw.direction === "custom" ||
    raw.direction === "diagonal"
      ? raw.direction
      : "diagonal";
  const hex = (value: unknown, fallback: string) =>
    typeof value === "string" && HEX_COLOR.test(value) ? value : fallback;
  const alpha = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 100;
  return {
    type,
    direction,
    color: hex(raw.color, BACKGROUND_DEFAULTS.color),
    from: hex(raw.from, BACKGROUND_DEFAULTS.from),
    to: hex(raw.to, BACKGROUND_DEFAULTS.to),
    alpha: alpha(raw.alpha),
    fromAlpha: alpha(raw.fromAlpha),
    toAlpha: alpha(raw.toAlpha),
    angle: alpha(raw.angle),
  };
}

/**
 * Coleção temática do storage: só aceita identificador que existe hoje.
 *
 * Um tema removido (ou um valor inventado no localStorage) volta a `null` — o
 * padrão da marca — em vez de carregar um tema pela metade.
 */
function normalizeThemeCollection(value: unknown): string | null {
  return typeof value === "string" ? (resolveThemeCollection(value)?.id ?? null) : null;
}

const preferencesStorage = {
  getItem: (name: string) => {
    const stored = localStorage.getItem(name);
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored) as PreferencesStorageValue;

        if (parsed.state) {
          parsed.state.theme = parsed.state.theme === "dark" ? "dark" : "light";
          parsed.state.themeSettings = normalizeThemeSettings(parsed.state.themeSettings);
          parsed.state.themeCollection = normalizeThemeCollection(parsed.state.themeCollection);
          // Estado salvo ANTES desta data existir: quem já tinha um tema escolhido aqui vale como
          // "escolhido agora" — senão a primeira recarga depois da correção deixaria o valor
          // antigo da conta vencer e a pessoa perderia o tema que estava vendo.
          const storedAt = parsed.state.themeCollectionUpdatedAt;
          parsed.state.themeCollectionUpdatedAt =
            typeof storedAt === "number" && Number.isFinite(storedAt)
              ? storedAt
              : parsed.state.themeCollection
                ? Date.now()
                : null;
          parsed.state.widgetBackground = normalizeBackgroundStyle(parsed.state.widgetBackground);
          parsed.state.pageBackground = normalizeBackgroundStyle(parsed.state.pageBackground);
          parsed.state.accentAlpha =
            typeof parsed.state.accentAlpha === "number" &&
            Number.isFinite(parsed.state.accentAlpha)
              ? Math.min(100, Math.max(0, parsed.state.accentAlpha))
              : 100;
          parsed.state.widgetAlpha =
            typeof parsed.state.widgetAlpha === "number" &&
            Number.isFinite(parsed.state.widgetAlpha)
              ? Math.min(100, Math.max(0, parsed.state.widgetAlpha))
              : null;
          parsed.state.pageAlpha =
            typeof parsed.state.pageAlpha === "number" && Number.isFinite(parsed.state.pageAlpha)
              ? Math.min(100, Math.max(0, parsed.state.pageAlpha))
              : null;
          parsed.state.displayNameFont = normalizeNameFont(parsed.state.displayNameFont);
          parsed.state.displayNameColor = normalizeNameColor(parsed.state.displayNameColor);
          parsed.state.displayNameTheme = normalizeNameTheme(parsed.state.displayNameTheme);
        }

        return JSON.stringify(parsed);
      } catch {
        return stored;
      }
    }

    const legacyTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    const legacySidebarCollapsed = localStorage.getItem(LEGACY_SIDEBAR_STORAGE_KEY);

    if (legacyTheme === null && legacySidebarCollapsed === null) return null;

    return JSON.stringify({
      state: {
        theme: legacyTheme === "dark" ? "dark" : "light",
        sidebarCollapsed: legacySidebarCollapsed === "true",
      },
      version: 0,
    });
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SIDEBAR_STORAGE_KEY);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "light",
      sidebarCollapsed: false,
      themeSettings: DEFAULT_THEME_SETTINGS,
      themeCollection: null,
      /** Quando a coleção foi escolhida AQUI (para resolver conflito com a conta). */
      themeCollectionUpdatedAt: null,
      widgetBackground: null,
      pageBackground: null,
      accentAlpha: 100,
      widgetAlpha: null,
      pageAlpha: null,
      displayNameFont: null,
      displayNameColor: null,
      displayNameTheme: null,

      setTheme: (theme: Theme) => set({ theme }),
      setThemeSettings: (themeSettings: ThemeSettings) =>
        set({ themeSettings: clampThemeSettings(themeSettings) }),
      // Restaurar o padrão devolve a marca inteira: cores livres E sem coleção.
      resetThemeSettings: () =>
        set({
          themeSettings: DEFAULT_THEME_SETTINGS,
          themeCollection: null,
          themeCollectionUpdatedAt: Date.now(),
          widgetBackground: null,
          pageBackground: null,
          accentAlpha: 100,
          widgetAlpha: null,
          pageAlpha: null,
        }),
      setThemeCollection: (themeCollection: string | null) =>
        set({ themeCollection, themeCollectionUpdatedAt: Date.now() }),
      setWidgetBackground: (widgetBackground: BackgroundStyle | null) => set({ widgetBackground }),
      setPageBackground: (pageBackground: BackgroundStyle | null) => set({ pageBackground }),
      setAccentAlpha: (accentAlpha: number) => set({ accentAlpha }),
      setWidgetAlpha: (widgetAlpha: number | null) => set({ widgetAlpha }),
      setPageAlpha: (pageAlpha: number | null) => set({ pageAlpha }),
      setDisplayNameFont: (displayNameFont) => set({ displayNameFont }),
      setDisplayNameColor: (displayNameColor) => set({ displayNameColor }),
      setDisplayNameTheme: (displayNameTheme) => set({ displayNameTheme }),
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => preferencesStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        themeSettings: state.themeSettings,
        themeCollection: state.themeCollection,
        themeCollectionUpdatedAt: state.themeCollectionUpdatedAt,
        widgetBackground: state.widgetBackground,
        pageBackground: state.pageBackground,
        accentAlpha: state.accentAlpha,
        widgetAlpha: state.widgetAlpha,
        pageAlpha: state.pageAlpha,
        displayNameFont: state.displayNameFont,
        displayNameColor: state.displayNameColor,
        displayNameTheme: state.displayNameTheme,
      }),
      skipHydration: true,
    },
  ),
);

let hydrationStarted = false;

export function hydratePreferences() {
  if (hydrationStarted) return;
  hydrationStarted = true;
  void usePreferencesStore.persist.rehydrate();
}
