import { useMemo, useRef, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

import {
  PROFILE_NAME_COLORS,
  PROFILE_NAME_FONTS,
  PROFILE_NAME_THEMES,
  profileNameFontFamily,
  profileNameTheme,
  profileNameThemePaint,
} from "@/constants/profile-name-fonts";
import { THEME_LIMITS } from "@/constants/theme-defaults";
import { THEME_PRESETS } from "@/constants/theme-presets";
import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import type { AppearanceDialogProps } from "@/types/components/appearance/appearance-dialog-props";
import type { ThemeAccent } from "@/types/preferences/theme-accent";
import type { ThemeBackground } from "@/types/preferences/theme-background";
import type { ThemePresetId } from "@/types/preferences/theme-preset-id";
import { Download, Moon, RotateCcw, Store, Sun, Upload } from "lucide-react";

import { cosmeticsApi } from "@/lib/api";
import { resolveThemeCollection } from "@/lib/theme/build-collection-css";
import { reportThemeContrast, sameThemeSettings } from "@/lib/theme/build-theme-tokens";
import { syncThemeCollection } from "@/lib/theme/sync-theme-collection";
import { THEME_FILE_EXTENSION, buildThemeFile, parseThemeFile } from "@/lib/theme/theme-file";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { BackgroundStylePicker } from "./background-style-picker";
import { CollectionGrid } from "./collection-grid";
import { ContrastNotice } from "./contrast-notice";
import { PresetRow } from "./preset-row";
import { RangeField } from "./range-field";
import { ThemePreview } from "./theme-preview";
import { ThemeSellDialog } from "./theme-sell-dialog";

/** Sliders trabalham em 0–100; a conversão para o valor real fica aqui. */
const CHROMA_MAX = {
  accent: THEME_LIMITS.accentChroma.max,
  background: THEME_LIMITS.backgroundChroma.max,
} as const;

function percent(value: number, max: number): string {
  return `${Math.round((value / max) * 100)}%`;
}

/**
 * Personalização do tema.
 *
 * As mudanças valem na hora — o diálogo é o próprio preview, com uma amostra do
 * app ao lado e um aviso de contraste que avisa quando a combinação fica difícil
 * de ler. Não há "salvar" porque não há o que desfazer depois: é preferência.
 */
export function AppearanceDialog({
  open,
  onOpenChange,
  profileName,
  profileNameFont,
  profileNameColor,
  profileNameTheme: profileNameThemeId,
}: AppearanceDialogProps) {
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const settings = usePreferencesStore((state) => state.themeSettings);
  const setThemeSettings = usePreferencesStore((state) => state.setThemeSettings);
  const resetThemeSettings = usePreferencesStore((state) => state.resetThemeSettings);
  const themeCollection = usePreferencesStore((state) => state.themeCollection);
  const setThemeCollection = usePreferencesStore((state) => state.setThemeCollection);
  const widgetBackground = usePreferencesStore((state) => state.widgetBackground);
  const setWidgetBackground = usePreferencesStore((state) => state.setWidgetBackground);
  const pageBackground = usePreferencesStore((state) => state.pageBackground);
  const setPageBackground = usePreferencesStore((state) => state.setPageBackground);
  const displayNameFont = usePreferencesStore((state) => state.displayNameFont);
  const setDisplayNameFont = usePreferencesStore((state) => state.setDisplayNameFont);
  const displayNameColor = usePreferencesStore((state) => state.displayNameColor);
  const setDisplayNameColor = usePreferencesStore((state) => state.setDisplayNameColor);
  const displayNameTheme = usePreferencesStore((state) => state.displayNameTheme);
  const setDisplayNameTheme = usePreferencesStore((state) => state.setDisplayNameTheme);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileMessage, setFileMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [sellOpen, setSellOpen] = useState(false);

  const selectedNameTheme = displayNameTheme ?? profileNameThemeId ?? "DEFAULT";
  const selectedNameThemeDefinition = profileNameTheme(selectedNameTheme);
  const selectedNameFont = displayNameFont ?? profileNameFont ?? selectedNameThemeDefinition.font;
  const selectedNameColor = displayNameColor ?? profileNameColor ?? "#ff7a18";
  const nameStyleMutation = useMutation({
    mutationFn: cosmeticsApi.setNameStyle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const report = useMemo(() => reportThemeContrast(settings, theme), [settings, theme]);

  const activeCollection = resolveThemeCollection(themeCollection);

  const handleCollectionSelect = (collectionId: string | null) => {
    setThemeCollection(collectionId);
    // O cache da conta acompanha a escolha na hora: sem isto, um refetch traria o
    // valor antigo do servidor e desfaria a troca em tela.
    queryClient.setQueryData(["me", "theme"], { theme: collectionId });
    void syncThemeCollection(collectionId);
  };

  /**
   * Exportar: o tema atual vira um arquivo `.enois-theme`.
   *
   * Vai tudo o que a pessoa vê — a coleção (por referência), as cores livres e os dois fundos
   * livres. O que NÃO vai é o que não é do tema: o modo claro/escuro fica de fora de propósito,
   * porque o arquivo é o mesmo nos dois.
   */
  const handleExport = () => {
    const text = buildThemeFile({
      collection: themeCollection,
      settings,
      name: activeCollection?.name ?? null,
      widget: widgetBackground,
      page: pageBackground,
    });
    const objectUrl = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${activeCollection?.id ?? "tema"}${THEME_FILE_EXTENSION}`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    setFileMessage(null);
  };

  /** Importar: aplica o arquivo inteiro (ou explica por que não deu) — nada pela metade. */
  const handleImport = async (file: File) => {
    const result = parseThemeFile(await file.text());
    if (!result.ok) {
      setFileMessage({ kind: "error", text: texts.appearance.fileErrors[result.reason] });
      return;
    }
    setThemeSettings(result.file.settings);
    setThemeCollection(result.file.collection);
    setWidgetBackground(result.file.widget ?? null);
    setPageBackground(result.file.page ?? null);
    // Mesmo cuidado da grade de temas: o cache da conta acompanha na hora.
    queryClient.setQueryData(["me", "theme"], { theme: result.file.collection });
    void syncThemeCollection(result.file.collection);
    setFileMessage({ kind: "ok", text: texts.appearance.fileImported });
  };

  const activePresetId = useMemo<ThemePresetId | null>(() => {
    const match = THEME_PRESETS.find((preset) => sameThemeSettings(preset.settings, settings));
    return match ? match.id : null;
  }, [settings]);

  const updateAccent = (patch: Partial<ThemeAccent>) =>
    setThemeSettings({ ...settings, accent: { ...settings.accent, ...patch } });

  const updateBackground = (patch: Partial<ThemeBackground>) =>
    setThemeSettings({ ...settings, background: { ...settings.background, ...patch } });

  const updateNameStyle = (
    patch: Partial<{
      theme: typeof selectedNameTheme;
      font: typeof selectedNameFont;
      color: string;
    }>,
  ) => {
    const nextTheme = patch.theme ?? selectedNameTheme;
    const nextThemeDefinition = profileNameTheme(nextTheme);
    const next = {
      theme: nextTheme,
      font: patch.font ?? (patch.theme ? nextThemeDefinition.font : selectedNameFont),
      color: patch.color ?? (patch.theme ? nextThemeDefinition.colors[0] : selectedNameColor),
    };
    setDisplayNameTheme(next.theme);
    setDisplayNameFont(next.font);
    setDisplayNameColor(next.color);
    nameStyleMutation.mutate(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.appearance.title}</DialogTitle>

          <DialogDescription>{texts.appearance.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <section className="space-y-2">
            <h3 className="text-xs font-medium text-text-strong">
              {texts.appearance.collectionsTitle}
            </h3>

            <p className="text-xs font-normal text-text-subtle">
              {texts.appearance.collectionsHint}
            </p>

            <CollectionGrid activeId={themeCollection} onSelect={handleCollectionSelect} />

            {activeCollection && (
              <p className="text-xs font-normal text-text-subtle">
                {texts.appearance.colorsNote(activeCollection.name)}
              </p>
            )}
          </section>

          <section className="space-y-3 border-t border-border-soft pt-4">
            <div className="space-y-0.5">
              <h3 className="text-xs font-medium text-text-strong">
                {texts.appearance.nameStyleTitle}
              </h3>

              <p className="text-xs font-normal text-text-subtle">
                {texts.appearance.nameStyleHint}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-text-strong">
                {texts.appearance.nameStyleThemesTitle}
              </h4>

              <p className="text-xs font-normal text-text-subtle">
                {texts.appearance.nameStyleThemesHint}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(PROFILE_NAME_THEMES).map(([theme, definition]) => {
                  const themeId = theme as typeof selectedNameTheme;
                  const themeColors = profileNameThemePaint(themeId);
                  const gradient = definition.colors.length > 1;
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => updateNameStyle({ theme: themeId })}
                      aria-pressed={selectedNameTheme === themeId}
                      className={cn(
                        "rounded-xl border px-2 py-3 text-center text-sm transition",
                        selectedNameTheme === themeId
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border-soft bg-surface-1 text-text-subtle hover:border-primary/60 hover:text-text-strong",
                        definition.className,
                      )}
                      style={{
                        fontFamily: profileNameFontFamily(definition.font),
                        ...(gradient
                          ? {
                              backgroundImage: themeColors,
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
                            }
                          : { color: definition.colors[0] }),
                      }}
                    >
                      {texts.appearance.nameStyleThemes[themeId]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {Object.entries(PROFILE_NAME_FONTS).map(([font, family]) => {
                const fontId = font as typeof selectedNameFont;
                return (
                  <button
                    key={font}
                    type="button"
                    onClick={() => updateNameStyle({ font: fontId })}
                    aria-pressed={selectedNameFont === fontId}
                    className={cn(
                      "rounded-xl border px-2 py-3 text-center text-xs transition",
                      selectedNameFont === fontId
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border-soft bg-surface-1 text-text-subtle hover:border-primary/60 hover:text-text-strong",
                    )}
                    style={{ fontFamily: family }}
                  >
                    {texts.appearance.nameStyleFonts[fontId]}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PROFILE_NAME_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={texts.appearance.nameStyleUseColor(color)}
                  aria-pressed={selectedNameColor === color}
                  onClick={() => updateNameStyle({ color })}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition",
                    selectedNameColor === color
                      ? "border-text-strong ring-2 ring-primary ring-offset-2 ring-offset-surface-card"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <label className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-1 px-3 py-1.5 text-xs text-text-subtle">
                {texts.appearance.nameStyleOtherColor}
                <input
                  type="color"
                  value={selectedNameColor}
                  onChange={(event) => updateNameStyle({ color: event.target.value })}
                  className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                />
              </label>
            </div>

            <div className="rounded-xl border border-border-soft bg-surface-1 px-4 py-3">
              <p className="text-xs text-text-subtle">{texts.appearance.nameStylePreview}</p>

              <p
                className={cn("mt-1 text-xl font-semibold", selectedNameThemeDefinition.className)}
                style={{
                  fontFamily: profileNameFontFamily(selectedNameFont),
                  ...(selectedNameThemeDefinition.colors.length > 1
                    ? {
                        backgroundImage: profileNameThemePaint(
                          selectedNameTheme,
                          selectedNameColor,
                        ),
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                    : { color: selectedNameColor }),
                }}
              >
                {profileName ?? texts.appearance.nameStylePreviewName}
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-medium text-text-strong">{texts.appearance.mode}</h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                aria-pressed={theme === "light"}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-normal transition",
                  theme === "light"
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border-soft bg-surface-1 text-text-subtle hover:text-text-strong",
                )}
              >
                <Sun className="h-3.5 w-3.5" />

                <>{texts.theme.light}</>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                aria-pressed={theme === "dark"}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-normal transition",
                  theme === "dark"
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border-soft bg-surface-1 text-text-subtle hover:text-text-strong",
                )}
              >
                <Moon className="h-3.5 w-3.5" />

                <>{texts.theme.dark}</>
              </button>
            </div>
          </section>

          {/* As cores livres valem SEMPRE: sem tema, são o tema; com tema, são
              camada por cima (destaque e fundo — superfícies ficam do tema). */}
          <section className="space-y-2">
            <h3 className="text-xs font-medium text-text-strong">{texts.appearance.presets}</h3>

            <PresetRow activeId={activePresetId} onSelect={setThemeSettings} />
          </section>

          <section className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-medium text-text-strong">
                {texts.appearance.accentSection}
              </h3>

              <p className="text-xs font-normal text-text-subtle">{texts.appearance.accentHint}</p>
            </div>

            <RangeField
              label={texts.appearance.hue}
              value={settings.accent.hue}
              min={THEME_LIMITS.hue.min}
              max={THEME_LIMITS.hue.max}
              step={1}
              valueLabel={texts.appearance.hueValue(Math.round(settings.accent.hue))}
              onChange={(hue) => updateAccent({ hue })}
              hueTrack
            />
            <RangeField
              label={texts.appearance.saturation}
              value={settings.accent.chroma}
              min={THEME_LIMITS.accentChroma.min}
              max={THEME_LIMITS.accentChroma.max}
              step={0.005}
              valueLabel={percent(settings.accent.chroma, CHROMA_MAX.accent)}
              onChange={(chroma) => updateAccent({ chroma })}
            />
            <RangeField
              label={texts.appearance.brightness}
              value={settings.accent.lightness}
              min={THEME_LIMITS.accentLightness.min}
              max={THEME_LIMITS.accentLightness.max}
              step={0.005}
              valueLabel={percent(
                settings.accent.lightness - THEME_LIMITS.accentLightness.min,
                THEME_LIMITS.accentLightness.max - THEME_LIMITS.accentLightness.min,
              )}
              onChange={(lightness) => updateAccent({ lightness })}
              hint={texts.appearance.brightnessHint}
            />
          </section>

          <section className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-medium text-text-strong">
                {texts.appearance.backgroundSection}
              </h3>

              <p className="text-xs font-normal text-text-subtle">
                {texts.appearance.backgroundHint}
              </p>
            </div>

            {/* Plano de fundo: automático, cor sólida ou gradiente. Com fundo
                    escolhido, o tingimento fino não faz sentido e fica fora. */}
            {/* Cor de widget (o interno dos cartões/painéis) e plano de fundo (a
                página atrás de tudo) — cada um com cor sólida ou gradiente. */}
            <div className="space-y-2 border-t border-border-soft pt-3">
              <p className="text-xs font-medium text-text-strong">
                {texts.appearance.bgStyleTitle}
              </p>

              <p className="text-xs font-normal text-text-subtle">{texts.appearance.bgStyleHint}</p>

              <BackgroundStylePicker value={widgetBackground} onChange={setWidgetBackground} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-text-strong">{texts.appearance.pageBgTitle}</p>

              <p className="text-xs font-normal text-text-subtle">{texts.appearance.pageBgHint}</p>

              <BackgroundStylePicker value={pageBackground} onChange={setPageBackground} />
            </div>

            {!activeCollection && !pageBackground && (
              <>
                <RangeField
                  label={texts.appearance.hue}
                  value={settings.background.hue}
                  min={THEME_LIMITS.hue.min}
                  max={THEME_LIMITS.hue.max}
                  step={1}
                  valueLabel={texts.appearance.hueValue(Math.round(settings.background.hue))}
                  onChange={(hue) => updateBackground({ hue })}
                  hueTrack
                />
                <RangeField
                  label={texts.appearance.backgroundIntensity}
                  value={settings.background.chroma}
                  min={THEME_LIMITS.backgroundChroma.min}
                  max={THEME_LIMITS.backgroundChroma.max}
                  step={0.001}
                  valueLabel={percent(settings.background.chroma, CHROMA_MAX.background)}
                  onChange={(chroma) => updateBackground({ chroma })}
                />
              </>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-medium text-text-strong">{texts.appearance.preview}</h3>

            <ThemePreview />
            {!activeCollection && <ContrastNotice report={report} />}
          </section>

          <section className="space-y-2 border-t border-border-soft pt-3">
            <h3 className="text-xs font-medium text-text-strong">{texts.appearance.fileSection}</h3>

            <p className="text-xs font-normal text-text-subtle">{texts.appearance.fileHint}</p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-auto rounded-full gap-2 text-xs"
                onClick={handleExport}
              >
                <Download className="h-3.5 w-3.5" />

                <>{texts.exportTheme}</>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-auto rounded-full gap-2 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />

                <>{texts.importTheme}</>
              </Button>

              {/* Qualquer aparência (coleção + cores livres + fundos) pode virar tema e ser
                  vendida: o marketplace deixa de ser só "tema de coleção". */}
              <Button
                type="button"
                variant="outline"
                className="w-auto rounded-full gap-2 text-xs"
                onClick={() => setSellOpen(true)}
              >
                <Store className="h-3.5 w-3.5" />

                <>{texts.sellTheme}</>
              </Button>
            </div>

            {/* O input fica escondido: quem abre é o botão de importar. */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".enois-theme,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleImport(file);
              }}
            />

            {fileMessage && (
              <p
                className={cn(
                  "text-xs",
                  fileMessage.kind === "ok" ? "text-growth" : "text-destructive",
                )}
              >
                {fileMessage.text}
              </p>
            )}
          </section>

          <div className="flex flex-wrap justify-between gap-2 border-t border-border-soft pt-4">
            <Button
              type="button"
              variant="ghost"
              className="w-auto rounded-full gap-2 text-sm"
              onClick={() => {
                resetThemeSettings();
                queryClient.setQueryData(["me", "theme"], { theme: null });
                void syncThemeCollection(null);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />

              <>{texts.appearance.reset}</>
            </Button>

            <Button
              type="button"
              className="w-auto rounded-full px-6 text-sm"
              onClick={() => onOpenChange(false)}
            >
              {texts.appearance.done}
            </Button>
          </div>
        </div>
      </DialogContent>

      <ThemeSellDialog open={sellOpen} onOpenChange={setSellOpen} />
    </Dialog>
  );
}
