import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import { hydratePreferences, usePreferencesStore } from "@/stores/preferences.store";
import { isGalleryCollectionId } from "@rede-enois/design-system/domain";

import { preferencesApi } from "@/lib/api";
import { hasSessionFlag } from "@/lib/session";

import { applyThemeSettings } from "./apply-theme";
import { resolveThemeCollection } from "./resolve-theme-collection";
import { syncThemeCollection } from "./sync-theme-collection";

/**
 * Único ponto que leva modo (claro/escuro), coleção temática e personalização para o DOM.
 *
 * Fica no root para valer em qualquer rota — inclusive nas telas públicas, que
 * não renderizam o botão de tema.
 */
export function useThemeSync(): void {
  const theme = usePreferencesStore((state) => state.theme);
  const themeSettings = usePreferencesStore((state) => state.themeSettings);
  const themeCollection = usePreferencesStore((state) => state.themeCollection);
  const widgetBackground = usePreferencesStore((state) => state.widgetBackground);
  const pageBackground = usePreferencesStore((state) => state.pageBackground);
  const accentAlpha = usePreferencesStore((state) => state.accentAlpha);
  const widgetAlpha = usePreferencesStore((state) => state.widgetAlpha);
  const pageAlpha = usePreferencesStore((state) => state.pageAlpha);

  useEffect(() => {
    hydratePreferences();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    applyThemeSettings(
      themeSettings,
      theme,
      themeCollection,
      widgetBackground,
      pageBackground,
      accentAlpha,
      widgetAlpha,
      pageAlpha,
    );
  }, [
    theme,
    themeSettings,
    themeCollection,
    widgetBackground,
    pageBackground,
    accentAlpha,
    widgetAlpha,
    pageAlpha,
  ]);

  useThemeAccountSync();
}

/**
 * Recupera o tema salvo na conta ao entrar.
 *
 * A regra é **quem escreveu por último ganha**, comparando a data das duas escolhas. Antes era
 * "a conta ganha" sempre, e isso engolia a escolha do dispositivo quando o envio para a conta
 * falhava (foi o que aconteceu enquanto a API estava fora: o tema voltava ao antigo a cada
 * recarga, mesmo tendo sido trocado aqui). Sem data na conta (nunca escolheu) ou com um
 * identificador que o front não conhece, o local vale e sobe.
 *
 * Convidado não chega aqui: sem sessão, a preferência é só local mesmo.
 */
function useThemeAccountSync(): void {
  const token = hasSessionFlag();
  const themeCollection = usePreferencesStore((state) => state.themeCollection);
  const themeCollectionUpdatedAt = usePreferencesStore((state) => state.themeCollectionUpdatedAt);
  const setThemeCollection = usePreferencesStore((state) => state.setThemeCollection);

  const { data } = useQuery({
    queryKey: ["me", "theme"],
    queryFn: () => preferencesApi.getTheme(),
    enabled: Boolean(token),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!token || data === undefined) return;

    const fromAccount = resolveThemeCollection(data.theme)?.id ?? null;
    if (fromAccount === themeCollection) return;

    const accountAt = data.updatedAt ? Date.parse(data.updatedAt) : 0;
    const localAt = themeCollectionUpdatedAt ?? 0;

    if (fromAccount && accountAt > localAt) {
      setThemeCollection(fromAccount);
      return;
    }
    if (themeCollection && !isGalleryCollectionId(themeCollection)) {
      // O daqui é mais novo (ou a conta não tem nada): sobe, em vez de aceitar o valor antigo.
      // Tema da COMUNIDADE não sobe: o pacote mora neste navegador (o backend só conhece os
      // temas da casa e recusaria o id) — a escolha vale localmente, e o próximo tema da casa
      // que a pessoa escolher volta a sincronizar.
      void syncThemeCollection(themeCollection);
    }
  }, [token, data, themeCollection, themeCollectionUpdatedAt, setThemeCollection]);
}
