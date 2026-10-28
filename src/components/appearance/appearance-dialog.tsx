import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import type { AppearanceDialogProps } from "@/types/components/appearance/appearance-dialog-props";
import {
  AppearanceDialog as AppearanceDialogView,
  type AppearanceFileStatus,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { cosmeticsApi, marketplaceApi, themesApi } from "@/lib/api";
import { registerGalleryCollection } from "@/lib/theme/gallery-collections";
import { resolveThemeCollection } from "@/lib/theme/resolve-theme-collection";
import { syncThemeCollection } from "@/lib/theme/sync-theme-collection";
import { THEME_FILE_EXTENSION, buildThemeFile, parseThemeFile } from "@/lib/theme/theme-file";
import { useIsAuthenticated } from "@/lib/use-auth";

import { ThemeSellDialog } from "./theme-sell-dialog";

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
  contributor = false,
  contributorTagColor = null,
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
  const [fileStatus, setFileStatus] = useState<AppearanceFileStatus | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [tagColor, setTagColor] = useState<string | null>(contributorTagColor);

  useEffect(() => {
    setTagColor(contributorTagColor);
  }, [contributorTagColor]);

  const nameStyleMutation = useMutation({
    mutationFn: cosmeticsApi.setNameStyle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const contributorTagMutation = useMutation({
    mutationFn: cosmeticsApi.setContributorTagColor,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  // Temas comprados na loja: o conteúdo é aberto pelo backend (só o comprador), registrado na
  // coleção local e aplicado como qualquer tema da galeria.
  const authenticated = useIsAuthenticated();
  const { toast } = useToast();
  const { data: purchases } = useQuery({
    queryKey: ["marketplace", "purchases", "themes"],
    queryFn: () => marketplaceApi.purchases(),
    enabled: authenticated,
    retry: false,
  });

  const applyPurchasedTheme = useMutation({
    mutationFn: (itemId: string) => themesApi.get(itemId),
    onSuccess: (purchased) => {
      const collection = registerGalleryCollection({
        id: purchased.id,
        name: purchased.name,
        description: "",
        packageJson: purchased.packageJson,
        modeDefault: purchased.modeDefault,
      });
      setThemeCollection(collection.id);
      toast(texts.appearance.purchasedThemeApplied, "success");
    },
    onError: () => toast(texts.appearance.purchasedThemeError, "error"),
  });

  const purchasedThemes = [
    ...new Map(
      (purchases ?? [])
        .filter(
          (purchase) =>
            purchase.itemKind === "THEME" && purchase.itemId && purchase.state !== "REFUNDED",
        )
        .map((purchase) => [purchase.itemId as string, purchase]),
    ).values(),
  ].map((purchase) => ({ itemId: purchase.itemId as string, title: purchase.title ?? null }));

  const updateContributorTag = (color: string | null) => {
    setTagColor(color);
    contributorTagMutation.mutate({ color });
  };

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
    setFileStatus(null);
  };

  /** Importar: aplica o arquivo inteiro (ou explica por que não deu) — nada pela metade. */
  const handleImport = async (file: File) => {
    const result = parseThemeFile(await file.text());
    if (!result.ok) {
      setFileStatus({ kind: "error", reason: result.reason });
      return;
    }
    setThemeSettings(result.file.settings);
    setThemeCollection(result.file.collection);
    setWidgetBackground(result.file.widget ?? null);
    setPageBackground(result.file.page ?? null);
    // Mesmo cuidado da grade de temas: o cache da conta acompanha na hora.
    queryClient.setQueryData(["me", "theme"], { theme: result.file.collection });
    void syncThemeCollection(result.file.collection);
    setFileStatus({ kind: "ok" });
  };

  return (
    <AppearanceDialogView
      open={open}
      onOpenChange={onOpenChange}
      profileName={profileName}
      nameStyle={{
        theme: displayNameTheme ?? profileNameThemeId ?? null,
        font: displayNameFont ?? profileNameFont ?? null,
        color: displayNameColor ?? profileNameColor ?? null,
      }}
      onNameStyleChange={(next) => {
        setDisplayNameTheme(next.theme);
        setDisplayNameFont(next.font);
        setDisplayNameColor(next.color);
        nameStyleMutation.mutate(next);
      }}
      mode={theme}
      onModeChange={setTheme}
      settings={settings}
      onSettingsChange={setThemeSettings}
      collectionId={themeCollection}
      activeCollection={activeCollection}
      onCollectionSelect={handleCollectionSelect}
      purchasedThemes={
        authenticated
          ? {
              themes: purchasedThemes,
              applyingItemId: applyPurchasedTheme.isPending ? applyPurchasedTheme.variables : null,
              onApply: (itemId) => applyPurchasedTheme.mutate(itemId),
            }
          : undefined
      }
      widgetBackground={widgetBackground}
      onWidgetBackgroundChange={setWidgetBackground}
      pageBackground={pageBackground}
      onPageBackgroundChange={setPageBackground}
      onExport={handleExport}
      onImport={(file) => void handleImport(file)}
      fileStatus={fileStatus}
      onSell={() => setSellOpen(true)}
      onReset={() => {
        resetThemeSettings();
        queryClient.setQueryData(["me", "theme"], { theme: null });
        void syncThemeCollection(null);
      }}
      sellDialog={<ThemeSellDialog open={sellOpen} onOpenChange={setSellOpen} />}
      contributorTagColor={tagColor}
      onContributorTagColorChange={contributor ? updateContributorTag : undefined}
    />
  );
}
