import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useThemeSync } from "./use-theme-sync";

const mocks = vi.hoisted(() => ({
  account: {
    theme: null as string | null,
    updatedAt: null as string | null,
  },
  state: {
    theme: "light",
    themeSettings: null,
    themeCollection: "terminal",
    themeCollectionUpdatedAt: Date.parse("2024-01-02T00:00:00Z"),
    previewThemeCollection: null,
    widgetBackground: null,
    pageBackground: null,
    accentAlpha: 100,
    widgetAlpha: null,
    pageAlpha: null,
    setThemeCollection: vi.fn(),
  },
  sync: vi.fn(),
}));

// A decisão é exercitada sem renderer; DOM, armazenamento e envio ficam nas portas mockadas.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => effect(),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: mocks.account }),
}));
vi.mock("@/stores/preferences.store", () => ({
  hydratePreferences: () => {},
  usePreferencesStore: (selector: (state: typeof mocks.state) => unknown) => selector(mocks.state),
}));
vi.mock("@/lib/session", () => ({ hasSessionFlag: () => true }));
vi.mock("@/lib/api", () => ({ preferencesApi: { getTheme: vi.fn() } }));
vi.mock("./apply-theme", () => ({ applyThemeSettings: () => {} }));
vi.mock("./sync-theme-collection", () => ({ syncThemeCollection: mocks.sync }));

function ThemeSyncProbe() {
  useThemeSync();
  return null;
}

describe("conflito entre tema local e tema da conta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("document", {
      documentElement: { classList: { toggle: vi.fn() } },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["padrão mais novo", null, "2024-01-03T00:00:00Z", true],
    ["padrão mais antigo", null, "2024-01-01T00:00:00Z", false],
    ["padrão sem data", null, null, false],
    ["identificador desconhecido mais novo", "tema-inexistente", "2024-01-03T00:00:00Z", false],
    ["coleção conhecida mais nova", "metro", "2024-01-03T00:00:00Z", true],
  ] as const)("%s", (_label, theme, updatedAt, acceptAccount) => {
    mocks.account.theme = theme;
    mocks.account.updatedAt = updatedAt;

    ThemeSyncProbe();

    expect(mocks.state.setThemeCollection.mock.calls).toEqual(acceptAccount ? [[theme]] : []);
    expect(mocks.sync.mock.calls).toEqual(acceptAccount ? [] : [["terminal"]]);
  });
});
