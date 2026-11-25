export type FigurinhaAutor = {
  username: string;
  nome: string;
  avatarUrl: string;
};

/** Página do catálogo: `autores` é um mapa `autorId → quem é`, para não repetir o dono por item. */
