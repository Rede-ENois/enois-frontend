import { useEffect, useState } from "react";

import { readEconomicMode, subscribeLiteFlags } from "./lite-mode";

/**
 * Modo econômico ligado neste aparelho? (`lite` **ou** BATATA)
 *
 * BATATA é um superconjunto do lite: quem usa a interface clássica também quer páginas maiores,
 * cache folgado e sem autoplay. Então tudo o que lê este hook — tamanho de página, intervalo de
 * recarga, mídia — já responde ao BATATA sem precisar de um segundo hook.
 *
 * Lê o espelho local (que o LiteModeEffects mantém sincronizado com a conta) e reage quando a
 * chave muda — assim o mesmo valor vale no servidor e no cliente sem piscar: o primeiro render é
 * sempre `false`, como no HTML do servidor, e o valor real entra logo depois da montagem.
 */
export function useLiteMode(): boolean {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const read = () => setLite(readEconomicMode());
    read();
    return subscribeLiteFlags(read);
  }, []);

  return lite;
}
