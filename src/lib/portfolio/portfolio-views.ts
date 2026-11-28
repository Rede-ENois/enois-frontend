import type { PortfolioBlockView } from "@/types/application/portfolio/portfolio-block-view";
import type { PortfolioMedia } from "@/types/application/portfolio/portfolio-media";
import type { UserProject } from "@/types/application/project/user-project";
import type {
  PortfolioBlock,
  PortfolioEditorBlock,
  PortfolioMediaKind,
  PortfolioProjectCard,
} from "@rede-enois/design-system/domain";

import { resolveCdnUrl } from "@/lib/api/media";

const MEDIA_KINDS: Record<string, PortfolioMediaKind> = {
  "image/": "IMAGE",
  "video/": "VIDEO",
  "application/pdf": "PDF",
};

/** O tipo de mídia pelo MIME; o que o app não sabe mostrar fica de fora (null). */
export function mediaKindOf(mimeType: string | null | undefined): PortfolioMediaKind | null {
  if (!mimeType) return null;
  const found = Object.entries(MEDIA_KINDS).find(([prefix]) => mimeType.startsWith(prefix));
  return found?.[1] ?? null;
}

/** As mídias que a vitrine publicada precisa carregar, uma vez cada. */
export function mediaIdsOf(blocks: PortfolioBlockView[]): string[] {
  return Array.from(
    new Set(
      blocks
        .filter((block) => block.type === "MEDIA" || block.type === "PDF")
        .map((block) => block.mediaId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

export function projectCardOf(project: UserProject): PortfolioProjectCard {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    banner: resolveCdnUrl(project.banner) ?? null,
    icon: resolveCdnUrl(project.icon) ?? null,
    stack: project.stack,
    repoUrl: project.repoUrl,
    status: project.status,
  };
}

/**
 * A peça no que a vitrine desenha. Peça de projeto sem o card na lista do perfil (projeto apagado
 * entre uma publicação e a leitura) mantém o título e o texto, sem o card; a página não some.
 *
 * A mídia só aparece quando o app resolveu o arquivo: enquanto as páginas do PDF estão em análise,
 * a leitura pública responde 404 e a peça fica sem imagem em vez de apontar para um endereço que
 * não abre.
 */
export function toShowcaseBlock(
  block: PortfolioBlockView,
  projects: Map<string, PortfolioProjectCard>,
  media: Map<string, PortfolioMedia>,
): PortfolioBlock {
  const resolved = block.mediaId ? media.get(block.mediaId) : undefined;
  return {
    id: block.id,
    kind: block.type,
    title: block.title,
    text: block.text,
    linkUrl: block.type === "LINK" ? block.linkUrl : null,
    project: block.projectId ? (projects.get(block.projectId) ?? null) : null,
    mediaKind: resolved?.kind ?? null,
    fileUrl: resolved?.fileUrl ?? null,
    imageUrl: resolved?.imageUrl ?? null,
  };
}

export function toEditorBlock(block: PortfolioBlockView): PortfolioEditorBlock {
  return {
    id: block.id,
    kind: block.type,
    title: block.title ?? "",
    text: block.text ?? "",
    projectId: block.projectId,
    mediaId: block.mediaId,
    linkUrl: block.linkUrl,
    unpublished: !block.published,
  };
}
