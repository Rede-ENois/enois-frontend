import type { UploadedMedia } from "./uploaded-media";

/**
 * Anexo escolhido no editor do blog: `file` enquanto sobe e `media` depois de subir (com o id que
 * o post guarda e a URL que a leitura usa). `uploadError` marca o que falhou e pode ser tentado de
 * novo; o anexo não entra no post enquanto não subir.
 */
export type VlogAttachment = {
  file: File;
  media: UploadedMedia | null;
  uploadError?: string | null;
};
