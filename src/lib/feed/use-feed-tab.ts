import { useEffect, useState } from "react";

import type { FeedTabChoice } from "@/types/routes/feed/feed-tab-choice";
import type { HomeTab } from "@/types/routes/feed/home-tab";

import { DEFAULT_FEED_TAB, readLastFeedTab, rememberFeedTab } from "./last-tab";

/**
 * A aba do feed. Manda a URL (`?aba=`); sem ela vale a última aba vista (guardada no navegador) e,
 * sem nada guardado, a padrão — "Tudo" na social, "Corporativo" na profissional.
 *
 * Social e corporativo são dois feeds separados com uma aba para cada, e as duas abas existem nas
 * duas interfaces: na social o corporativo é alcançável sem passar pelo perfil (#723); na
 * profissional o início continua sendo o corporativo. Uma escolha que passa pela URL volta como
 * está, inclusive na profissional, que antes forçava a aba e levava o link de volta para o mesmo
 * lugar.
 *
 * A aba que chega pela URL (link, "voltar" de uma publicação) também vira a última: o "Início" do
 * menu leva para /feed sem `?aba=` e precisa continuar na aba em que a pessoa está.
 *
 * O servidor não lê o localStorage: a primeira renderização (servidor e hidratação) usa a aba
 * padrão e a escolha guardada entra num efeito, como `useIsAuthenticated`. Ler direto na
 * renderização quebraria a hidratação ("Em Alta" no cliente contra "Tudo" no HTML). `ready` diz que
 * a aba já é a definitiva, para quem busca dados por ela esperar em vez de pedir "Tudo" à toa.
 */
export function useFeedTab(
  aba: HomeTab | undefined,
  professional: boolean,
  goToTab: (tab: FeedTabChoice) => void,
) {
  const defaultTab: HomeTab = professional ? "CORPORATE" : DEFAULT_FEED_TAB;
  const [stored, setStored] = useState<HomeTab | null>(null);

  useEffect(() => {
    // Na profissional a memória só vale depois de alguém escolher uma aba social lá; a aba
    // guardada pela social não pode puxar o início para fora do corporativo.
    setStored(professional ? null : readLastFeedTab());
  }, [professional]);

  useEffect(() => {
    if (!aba) return;
    rememberFeedTab(aba);
    setStored(aba);
  }, [aba]);

  const tab: HomeTab = aba ?? stored ?? defaultTab;
  const ready = aba !== undefined || stored !== null || professional;
  // A aba social em que a pessoa estava: o corporativo usa para levar de volta ao que ela via.
  const socialTab: HomeTab = stored ?? DEFAULT_FEED_TAB;

  const setTab = (next: HomeTab) => {
    if (next === tab) return;
    rememberFeedTab(next);
    setStored(next);
    // Repetir a padrão não precisa ir para a URL: /feed sem `?aba=` já abre nela.
    goToTab(next === defaultTab ? null : next);
  };
  return { tab, setTab, ready, socialTab } as const;
}
