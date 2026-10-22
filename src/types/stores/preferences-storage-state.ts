export type PreferencesStorageState = {
  theme?: string;
  sidebarCollapsed?: boolean;
  /** Sem tipo de propósito: vem do storage, que pode ter sido editado à mão. */
  themeSettings?: unknown;
  themeCollection?: unknown;
  themeCollectionUpdatedAt?: unknown;
  widgetBackground?: unknown;
  pageBackground?: unknown;
  accentAlpha?: unknown;
  widgetAlpha?: unknown;
  pageAlpha?: unknown;
  displayNameFont?: unknown;
  displayNameColor?: unknown;
  displayNameTheme?: unknown;
};
