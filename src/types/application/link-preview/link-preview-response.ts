import type { LinkPreview } from "./link-preview";

/** Resposta do `GET /link-preview`: `preview` nulo = nao ha cartao para este endereco. */
export type LinkPreviewResponse = {
  preview: LinkPreview | null;
};
