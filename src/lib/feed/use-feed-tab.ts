import { useEffect, useState } from "react";

import type { HomeTab } from "@/types/routes/feed/home-tab";

import { DEFAULT_FEED_TAB, readLastFeedTab, rememberFeedTab } from "./last-tab";

/**
 * A aba do feed. Manda a URL (`?aba=`); sem ela vale a última aba vista (guardada no navegador) e,
 * sem nada guardado, "Tudo". Na interface profissional o início É o feed corporativo, e `?aba=CORPORATE`
 * na social não existe: cai na última aba.
 *
 * A aba que chega pela URL (link, "voltar" de uma publicação) também vira a última: o "Início" do
 * menu leva para /feed sem `?aba=` e precisa continuar na aba em que a pessoa está.
 *
 * O servidor não lê o localStorage: a primeira renderização (servidor e hidratação) usa "Tudo" e a
 * aba guardada entra num efeito, como `useIsAuthenticated`. Ler direto na renderização quebraria a
 * hidratação ("Em Alta" no cliente contra "Tudo" no HTML). `ready` diz que a aba já é a definitiva,
 * para quem busca dados por ela esperar em vez de pedir "Tudo" à toa.
 */
export function useFeedTab(
  aba: HomeTab | undefined,
  professional: boolean,
  goToTab: (tab: HomeTab) => void,
) {
  const [stored, setStored] = useState<HomeTab | null>(null);
  const urlTab = !professional && aba !== "CORPORATE" ? aba : undefined;

  useEffect(() => {
    setStored(readLastFeedTab());
  }, []);

  useEffect(() => {
    if (!urlTab) return;
    rememberFeedTab(urlTab);
    setStored(urlTab);
  }, [urlTab]);

  const tab: HomeTab = professional ? "CORPORATE" : (urlTab ?? stored ?? DEFAULT_FEED_TAB);
  const ready = professional || urlTab !== undefined || stored !== null;

  const setTab = (next: HomeTab) => {
    if (next === tab) return;
    rememberFeedTab(next);
    setStored(next);
    goToTab(next);
  };
  return { tab, setTab, ready };
}
