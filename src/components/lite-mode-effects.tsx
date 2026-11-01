import { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  readCardTilt,
  readForceMotion,
  readLiteMode,
  subscribeLiteFlags,
  writeLiteMode,
} from "@/lib/lite-mode";
import { usePersonalization } from "@/lib/use-personalization";

function readLocalFlags() {
  return { lite: readLiteMode(), forceMotion: readForceMotion(), cardTilt: readCardTilt() };
}

/**
 * Liga o Modo lite no documento inteiro (e a teimosia de animações, para quem pediu).
 *
 * A conta é a fonte da escolha (`liteMode`); o espelho no aparelho só existe para o primeiro
 * paint e para quando a resposta ainda não chegou. O `<html data-lite>` desliga animações e
 * transições pelo CSS, e o cache ganha mais folga: em aparelho fraco, repetir a mesma busca é
 * justamente o que trava a tela.
 */
export function LiteModeEffects() {
  const queryClient = useQueryClient();
  const { data } = usePersonalization();
  // Read on the first render: starting at `false` made the first effect strip the `data-lite`
  // the pre-paint script had set, so animations switched on for a frame and off again.
  const [local, setLocal] = useState(readLocalFlags);

  useEffect(() => subscribeLiteFlags(() => setLocal(readLocalFlags())), []);

  const lite = data?.liteMode ?? local.lite;

  useEffect(() => {
    if (data) writeLiteMode(lite);
  }, [data, lite]);

  useEffect(() => {
    const root = document.documentElement;
    if (lite) root.setAttribute("data-lite", "");
    else root.removeAttribute("data-lite");
    // Vídeo que já estava tocando sozinho para junto: ligar o modo lite no meio do feed vale
    // para o que está na tela agora, não só para o próximo vídeo que aparecer.
    if (lite) {
      for (const video of document.querySelectorAll("video")) {
        if (!video.paused) video.pause();
      }
    }
  }, [lite]);

  useEffect(() => {
    const root = document.documentElement;
    // Modo lite manda: com ele ligado, animação nenhuma acontece de qualquer jeito.
    if (local.forceMotion && !lite) root.setAttribute("data-force-motion", "");
    else root.removeAttribute("data-force-motion");
  }, [local.forceMotion, lite]);

  useEffect(() => {
    // O design system lê este atributo a cada movimento do mouse no cartão de perfil.
    const root = document.documentElement;
    if (local.cardTilt) root.removeAttribute("data-no-tilt");
    else root.setAttribute("data-no-tilt", "");
  }, [local.cardTilt]);

  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        // Cache com mais folga em modo lite: a mesma tela volta do cache em vez de voltar à rede.
        staleTime: lite ? 5 * 60_000 : 30_000,
        refetchOnWindowFocus: !lite,
        retry: 1,
      },
    });
  }, [lite, queryClient]);

  return null;
}
