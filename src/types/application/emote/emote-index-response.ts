/** Índice compacto: código → caminho da imagem. É o que o texto carrega para achar cada figurinha. */
export type EmoteIndexResponse = {
  entries: Record<string, string>;
  generatedAt: string;
};
