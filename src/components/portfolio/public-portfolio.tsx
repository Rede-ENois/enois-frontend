import { useQueries, useQuery } from "@tanstack/react-query";

import type { PortfolioMedia } from "@/types/application/portfolio/portfolio-media";
import type { PortfolioPages } from "@/types/application/portfolio/portfolio-pages";
import type { PublishedPortfolio } from "@/types/application/portfolio/published-portfolio";
import { PortfolioShowcase } from "@rede-enois/design-system/domain";

import { mediaApi, projectsApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { firstPageUrl, serveObject } from "@/lib/portfolio/portfolio-pages";
import {
  mediaIdsOf,
  mediaKindOf,
  projectCardOf,
  toShowcaseBlock,
} from "@/lib/portfolio/portfolio-views";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * A vitrine profissional de uma pessoa, do jeito que qualquer um a vê.
 *
 * A API publica as peças com referências (id do projeto, id da mídia); o card do projeto vem da
 * lista de projetos do perfil e o arquivo da mídia do próprio asset. Peça cujo projeto sumiu
 * continua na página com o título e o texto; peça de mídia sem arquivo resolvido — o PDF com as
 * páginas em análise responde 404 — não aponta para lugar nenhum.
 */
export function PublicPortfolio({
  portfolio,
  username,
  name,
  avatarUrl,
  avatarFrame,
  pages,
}: {
  portfolio: PublishedPortfolio;
  username: string;
  name: string;
  avatarUrl: string | null;
  avatarFrame: string | null;
  /** As páginas já carregadas pelo chamador, por mídia do documento. */
  pages: Map<string, PortfolioPages>;
}) {
  const projectIds = new Set(
    portfolio.blocks
      .filter((block) => block.type === "PROJECT" && block.projectId)
      .map((block) => block.projectId as string),
  );

  const mediaIds = mediaIdsOf(portfolio.blocks);

  const projects = useQuery({
    queryKey: ["user-projects", username],
    queryFn: () => projectsApi.byUser(username),
    staleTime: 5 * 60_000,
    enabled: projectIds.size > 0,
  });

  const media = useQueries({
    queries: mediaIds.map((mediaId) => ({
      queryKey: ["portfolio-media", mediaId],
      queryFn: () => mediaApi.get(mediaId),
      staleTime: 5 * 60_000,
      retry: false,
    })),
  });

  const projectMap = new Map(
    (projects.data ?? [])
      .filter((project) => projectIds.has(project.id))
      .map((project) => [project.id, projectCardOf(project)]),
  );

  const mediaMap = new Map<string, PortfolioMedia>();
  mediaIds.forEach((mediaId, index) => {
    const asset = media[index]?.data;
    if (!asset) return;
    const kind = mediaKindOf(asset.mimeType);
    const fileUrl = serveObject(asset.cdnUrl);
    if (!kind || !fileUrl) return;
    mediaMap.set(mediaId, {
      kind,
      fileUrl,
      imageUrl: kind === "PDF" ? firstPageUrl(pages.get(mediaId)) : null,
    });
  });

  return (
    <PortfolioShowcase
      author={{
        username,
        name,
        avatarUrl: resolveCdnUrl(avatarUrl) ?? null,
        avatarFrame: avatarFrame ?? null,
      }}
      profileHref={`/perfil/${encodeURIComponent(username)}`}
      html={portfolio.html ?? null}
      publishedAt={portfolio.publishedAt}
      blocks={portfolio.blocks.map((block) => toShowcaseBlock(block, projectMap, mediaMap))}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
    />
  );
}
