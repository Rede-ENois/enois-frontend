/** Um evento do diário do perfil, exatamente como o backend devolve em `/users/{username}/diario`. */
export type DiarioEvento = {
  tipo: "PUBLICACAO" | "COMENTARIO" | "REPOST";
  quando: string;
  postId: string;
  trecho: string | null;
  contexto: {
    autorNome: string | null;
    autorUsername: string | null;
    trecho: string | null;
  } | null;
};
