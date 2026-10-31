/**
 * Enquete de um post (`type: "POLL"`): o título é o `content` do post. `counts` está na mesma
 * ordem de `options`; `myVote` é a posição em que a pessoa votou (ou null) — o voto é único e não
 * pode ser trocado depois.
 */
export type PollView = {
  options: string[];
  counts: number[];
  myVote: number | null;
  totalVotes: number;
};
