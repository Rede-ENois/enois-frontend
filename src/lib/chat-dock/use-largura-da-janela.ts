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
  // O valor inicial já é a largura real: no servidor é 0 (o dock nem aparece sem sessão), e no
  // cliente evita o primeiro render sem janelas (o "flash" de quem abre duas conversas).
  const [largura, setLargura] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerWidth,
  );

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
