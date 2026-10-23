import { describe, expect, it } from "vitest";

import { texts } from "./texts";

/**
 * O app fala português do começo ao fim — inclusive nas telas de erro, que são justamente as que
 * a pessoa vê quando algo deu errado. Em 2026-10-21 a página 404 e a error boundary do app
 * inteiro estavam em inglês ("Page not found", "Try again", "Go home") e ninguém tinha reparado,
 * porque a tela só aparece quando algo quebra.
 *
 * Este teste varre TODOS os valores de `texts` e falha se algum tiver palavra que é claramente
 * inglesa. A lista é de marcadores inequívocos (o português não tem "the", "your", "try again"),
 * então texto em português não corre risco de ser acusado por engano. Texto novo em inglês:
 * traduza, não acrescente exceção aqui.
 */

const MARCADORES_INGLESES = [
  /\bthe\b/i,
  /\byour\b/i,
  /\byou're\b/i,
  /\bwe're\b/i,
  /\bdon't\b/i,
  /\bdoesn't\b/i,
  /\bnot found\b/i,
  /\bpage not found\b/i,
  /\btry again\b/i,
  /\bgo home\b/i,
  /\bsomething went wrong\b/i,
  /\bthis page\b/i,
  /\bloading\b/i,
];

/** Só o VALOR é testado — o caminho tem nome de chave em ingles ("loading") e nao e copy. */
function valores(node: unknown, caminho = "texts"): { caminho: string; valor: string }[] {
  if (typeof node === "string") return [{ caminho, valor: node }];
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => valores(item, `${caminho}[${i}]`));
  }
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([chave, valor]) => valores(valor, `${caminho}.${chave}`));
  }
  return [];
}

describe("texts da interface", () => {
  it("não tem texto de UI em inglês", () => {
    const flagrados: string[] = [];
    for (const { caminho, valor } of valores(texts)) {
      if (MARCADORES_INGLESES.some((marcador) => marcador.test(valor))) {
        flagrados.push(`${caminho} = ${valor}`);
      }
    }
    expect(flagrados).toEqual([]);
  });

  /**
   * A identidade do produto mudou em 2026-10-21: o Énóis deixou de se dizer "rede profissional"
   * e passou a se dizer rede humana (conversa, comunidades, trabalho, estudo, brincadeira e
   * construção). A varredura achou a frase antiga sobrevivendo em três superfícies de entrada
   * que ninguém abre no dia a dia: a descrição do login, o rodapé e o manifesto do PWA.
   *
   * "Perfil profissional" continua existindo (é a feature do alter ego corporativo) e por isso o
   * marcador é a frase inteira, não a palavra "profissional".
   */
  it("não chama o Énóis de rede profissional", () => {
    const flagrados: string[] = [];
    for (const { caminho, valor } of valores(texts)) {
      if (/rede profissional/i.test(valor) || /jornada profissional/i.test(valor)) {
        flagrados.push(`${caminho} = ${valor}`);
      }
    }
    expect(flagrados).toEqual([]);
  });

  /**
   * A marca é "o Énóis" (o projeto, a rede, o app). "da Énóis" e "a Énóis" apareciam em três
   * telas de entrada: a de redefinir senha, a do convite de instalar o app e a descrição do
   * login. Nenhuma delas está no caminho principal, então o erro passou anos sem ninguém ver.
   */
  it("usa o artigo masculino da marca (o Énóis)", () => {
    const flagrados: string[] = [];
    for (const { caminho, valor } of valores(texts)) {
      if (/\ba Énóis\b/.test(valor) || /\bda Énóis\b/.test(valor)) {
        flagrados.push(`${caminho} = ${valor}`);
      }
    }
    expect(flagrados).toEqual([]);
  });
});
