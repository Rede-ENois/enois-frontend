import type { ProfileNameFont } from "@/types/application/cosmetics/profile-name-font";
import type { ProfileNameTheme } from "@/types/application/cosmetics/profile-name-theme";
import type { BackgroundStyle, Theme, ThemeSettings } from "@rede-enois/design-system/domain";

export type PreferencesState = {
  theme: Theme;
  sidebarCollapsed: boolean;
  themeSettings: ThemeSettings;
  /** Coleção temática ativa (`null` = padrão da marca). */
  themeCollection: string | null;
  /** Quando a coleção foi escolhida neste dispositivo (conflito com a conta). */
  themeCollectionUpdatedAt: number | null;
  /** Cor de widget escolhida (cartões/painéis/menus); `null` = do tema ou da marca. */
  widgetBackground: BackgroundStyle | null;
  /** Plano de fundo da página (atrás de tudo); `null` = do tema ou da marca. */
  pageBackground: BackgroundStyle | null;
  /** Transparência do destaque (0–100; 100 = opaco). */
  accentAlpha: number;
  /** Transparência dos widgets; `null` = a nativa do tema (ou opaco). */
  widgetAlpha: number | null;
  /** Transparência da página; `null` = a nativa do tema (ou opaca). */
  pageAlpha: number | null;
  /** Estilo local usado imediatamente enquanto o perfil sincroniza com o backend. */
  displayNameFont: ProfileNameFont | null;
  displayNameColor: string | null;
  displayNameTheme: ProfileNameTheme | null;
  setTheme: (theme: Theme) => void;
  setThemeSettings: (settings: ThemeSettings) => void;
  resetThemeSettings: () => void;
  setThemeCollection: (collectionId: string | null) => void;
  setWidgetBackground: (style: BackgroundStyle | null) => void;
  setPageBackground: (style: BackgroundStyle | null) => void;
  setAccentAlpha: (alpha: number) => void;
  setWidgetAlpha: (alpha: number | null) => void;
  setPageAlpha: (alpha: number | null) => void;
  setDisplayNameFont: (font: PreferencesState["displayNameFont"]) => void;
  setDisplayNameColor: (color: string | null) => void;
  setDisplayNameTheme: (theme: PreferencesState["displayNameTheme"]) => void;
  toggleSidebar: () => void;
};
