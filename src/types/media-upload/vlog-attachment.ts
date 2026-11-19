import type { UploadedMedia } from "./uploaded-media";

/**
 * Anexo escolhido no editor do blog: `file` enquanto sobe e `media` depois de subir (com o id que
 * o post guarda e a URL que a leitura usa).
 */
export type VlogAttachment = {
  file: File;
  media: UploadedMedia | null;
};
