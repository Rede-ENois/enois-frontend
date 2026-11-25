/** O que a leitura do arquivo concluiu. `sintoma` é o código que a tela sabe explicar. */
export type SintomaDoArquivo =
  | { sintoma: null; mimeType: "image/png" | "image/jpeg"; largura: number; altura: number }
  | { sintoma: "FIGURINHA_ARQUIVO_GRANDE" }
  | { sintoma: "FIGURINHA_FORMATO" }
  | { sintoma: "FIGURINHA_DIMENSOES" }
  | { sintoma: "FIGURINHA_FALHOU" };
