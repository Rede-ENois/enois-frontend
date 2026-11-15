/** Publicação pública de ficha: cópia do recorte que o dono abriu; sem id de ficha/campanha/dono. */
export type LibraryPublication = {
  id: string;
  characterName: string;
  gameSystem: string;
  fields: Record<string, string>;
  publishedAt: string;
  updatedAt: string;
};
