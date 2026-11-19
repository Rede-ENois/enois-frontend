/** "https://enois.ia.br/feed/post_9#x" → "post_9"; id puro passa direto. Serve a murais e coleções. */
export function postIdDoElo(elo: string): string {
  const semCorte = elo.trim().split(/[?#]/)[0] ?? "";
  const pedacos = semCorte.split("/").filter((pedaco) => pedaco.length > 0);
  return pedacos[pedacos.length - 1] ?? semCorte;
}
