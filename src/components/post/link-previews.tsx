import type { RenderLinkPreview } from "@rede-enois/design-system/domain";

import { LinkPreviewCard } from "./link-preview-card";

/**
 * O slot que o DS chama para cada link de página de um post ou comentário (o DS continua dono do
 * resto: link de player vira o player, mídia direta fica no texto, link repetido conta uma vez).
 *
 * Estável de propósito: é criado uma vez no módulo, não a cada render do card.
 */
export const renderLinkPreview: RenderLinkPreview = (url, { compact }) => (
  <LinkPreviewCard url={url} compact={compact} />
);
