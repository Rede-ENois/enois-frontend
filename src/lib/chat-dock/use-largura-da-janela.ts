import { useEffect, useState } from "react";

/**
 * Largura da janela do navegador, em pixels (0 no servidor).
 *
 * O dock de chat precisa dela para saber quantas mini-janelas cabem na tela: ele é ancorado à
 * direita e cresce para a esquerda, então uma janela a mais pode sair fora da tela.
 *
 * A medição é feita num `requestAnimationFrame` para não forçar layout a cada tecla digitada:
 * quem chama lê o valor no render seguinte.
 */
export function useLarguraDaJanela(): number {
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    let agendado = 0;

    const medir = () => {
      agendado = 0;
      setLargura(window.innerWidth);
    };

    const aoRedimensionar = () => {
      if (agendado !== 0) return;
      agendado = window.requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("resize", aoRedimensionar);

    return () => {
      window.removeEventListener("resize", aoRedimensionar);
      if (agendado !== 0) window.cancelAnimationFrame(agendado);
    };
  }, []);

  return largura;
}
