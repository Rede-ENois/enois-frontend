import { useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { readBatataMode, writeBatataMode } from "@/lib/batata-mode";
import {
  readCardTilt,
  readForceMotion,
  readLiteMode,
  subscribeLiteFlags,
  writeLiteMode,
} from "@/lib/lite-mode";
import { usePersonalization } from "@/lib/use-personalization";
import { ensureWebFonts } from "@/lib/web-fonts";

/**
 * Liga o Modo lite (e o BATATA) no documento inteiro — e a teimosia de animações, para quem pediu.
 *
 * A conta é a fonte das duas escolhas (`liteMode` e `batataMode`); o espelho no aparelho só existe
 * para o primeiro paint e para quando a resposta ainda não chegou. Este é o **único** ponto que
 * escreve no `<html>`:
 *
 * - `data-lite` = lite **ou** BATATA. É o que desliga animações, transições e `backdrop-filter` e
 *   o que o resto do app consulta para páginas maiores, cache folgado e sem autoplay. Como o
 *   BATATA é um superconjunto, a chave do lite não é reescrita quando o BATATA liga;
 * - `data-batata` = só o BATATA. É a camada de estilo que apaga sombra, gradiente, desfoque, canto
 *   arredondado e tipografia decorativa.
 *
 * Desligar o BATATA remove o atributo e a tela volta exatamente ao que o lite era: nenhuma escolha
 * de tema, cor ou outra preferência é tocada.
 */
export function LiteModeEffects() {
  const queryClient = useQueryClient();
  const { data } = usePersonalization();
  const [local, setLocal] = useState({
    lite: false,
    batata: false,
    forceMotion: false,
    cardTilt: true,
  });

  useEffect(() => {
    const read = () =>
      setLocal({
        lite: readLiteMode(),
        batata: readBatataMode(),
        forceMotion: readForceMotion(),
        cardTilt: readCardTilt(),
      });
    read();
    return subscribeLiteFlags(read);
  }, []);

  const lite = data?.liteMode ?? local.lite;
  const batata = data?.batataMode ?? local.batata;
  // BATATA é um superconjunto do lite; o CSS e o resto do app recebem o modo somado.
  const economic = lite || batata;

  useEffect(() => {
    if (!data) return;
    writeLiteMode(data.liteMode);
    // Resposta de um backend ainda sem a coluna: não apaga o espelho que já estava no aparelho.
    if (typeof data.batataMode === "boolean") writeBatataMode(data.batataMode);
  }, [data]);

  useEffect(() => {
    const root = document.documentElement;
    if (economic) root.setAttribute("data-lite", "");
    else root.removeAttribute("data-lite");
    if (batata) root.setAttribute("data-batata", "");
    else root.removeAttribute("data-batata");
    // Vídeo que já estava tocando sozinho para junto: ligar o modo econômico no meio do feed vale
    // para o que está na tela agora, não só para o próximo vídeo que aparecer.
    if (economic) {
      for (const video of document.querySelectorAll("video")) {
        if (!video.paused) video.pause();
      }
    }
  }, [economic, batata]);

  // Sair do BATATA com a tela aberta precisa trazer a fonte de volta: o `<head>` só a pediu quando
  // o aparelho não estava em modo econômico. Daqui para frente o efeito é o mesmo de antes.
  const previousBatata = useRef<boolean | null>(null);
  useEffect(() => {
    const previous = previousBatata.current;
    previousBatata.current = batata;
    if (previous === true && !batata) ensureWebFonts();
  }, [batata]);

  useEffect(() => {
    const root = document.documentElement;
    // Modo econômico manda: com ele ligado, animação nenhuma acontece de qualquer jeito.
    if (local.forceMotion && !economic) root.setAttribute("data-force-motion", "");
    else root.removeAttribute("data-force-motion");
  }, [local.forceMotion, economic]);

  useEffect(() => {
    // O design system lê este atributo a cada movimento do mouse no cartão de perfil. No BATATA
    // não há inclinação para calcular: o listener sai do caminho junto.
    const root = document.documentElement;
    if (local.cardTilt && !batata) root.removeAttribute("data-no-tilt");
    else root.setAttribute("data-no-tilt", "");
  }, [local.cardTilt, batata]);

  useEffect(() => {
    queryClient.setDefaultOptions({
      queries: {
        // Cache com mais folga no modo econômico: a mesma tela volta do cache em vez de ir à rede.
        staleTime: economic ? 5 * 60_000 : 30_000,
        refetchOnWindowFocus: !economic,
        retry: 1,
      },
    });
  }, [economic, queryClient]);

  return null;
}
