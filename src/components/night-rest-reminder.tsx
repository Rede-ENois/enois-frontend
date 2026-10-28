import { useEffect, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { NightRestReminder as NightRestReminderView } from "@rede-enois/design-system/domain";

import { preferencesApi } from "@/lib/api";
import { nightKey, shouldShowNightRest } from "@/lib/night-rest";
import { usePersonalization } from "@/lib/use-personalization";

/**
 * Popup de cuidado ao abrir o feed entre 00:00 e 04:59 no relógio do aparelho.
 *
 * - a preferência vem da conta (`nightRestReminder`), com default ligado no backend;
 * - fechar o popup grava no BANCO a data local da noite (`nightRestDismissedOn`), então
 *   reload, navegação e outro aparelho não reabrem o mesmo aviso na mesma madrugada;
 * - a data guardada é comparada com a data de hoje: à meia-noite seguinte ela muda e o
 *   lembrete volta a poder aparecer — sem job de reset no servidor;
 * - um tick de 30s fecha o popup quando o relógio passa das 05:00 e cobre a virada do dia;
 * - falha ao carregar a preferência não bloqueia nem atrasa o feed: simplesmente não aparece.
 */
export function NightRestReminder() {
  const { data } = usePersonalization();
  const queryClient = useQueryClient();
  const pathname = useLocation({ select: (state) => state.pathname });
  const enabled = data?.nightRestReminder;
  const dismissedOn = data?.nightRestDismissedOn ?? null;
  const [open, setOpen] = useState(false);
  // Cobre o intervalo entre o clique e a resposta do servidor (e uma falha de rede).
  const dismissedNight = useRef<string | null>(null);

  const dismissOnServer = useMutation({
    mutationFn: (night: string) => preferencesApi.dismissNightRest(night),
    onSuccess: (updated) => queryClient.setQueryData(["personalization"], updated),
  });

  useEffect(() => {
    const check = () => {
      if (pathname !== "/feed") {
        setOpen(false);
        return;
      }
      const now = new Date();
      const today = nightKey(now);
      const alreadyDismissed = dismissedNight.current === today || dismissedOn === today;
      setOpen(shouldShowNightRest(enabled, now, alreadyDismissed ? today : null));
    };

    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [enabled, pathname, dismissedOn]);

  const dismiss = () => {
    const today = nightKey(new Date());
    dismissedNight.current = today;
    setOpen(false);
    dismissOnServer.mutate(today);
  };

  return <NightRestReminderView open={open} onDismiss={dismiss} />;
}
