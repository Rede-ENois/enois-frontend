/**
 * Enquete de um post (`type: "POLL"`): o título é o `content` do post. `counts` está na mesma
 * ordem de `options`; `myVotes` são as posições escolhidas por quem lê (vazio se ainda não
 * votou) e mudam quando a pessoa troca o voto. `multipleChoice` libera várias alternativas por
 * pessoa; `endsAt` (ISO-8601) é o prazo — passado ele, ninguém vota mais e o resultado congela.
 */
export type PollView = {
  options: string[];
  counts: number[];
  myVotes: number[];
  totalVotes: number;
  multipleChoice: boolean;
  endsAt: string | null;
};
