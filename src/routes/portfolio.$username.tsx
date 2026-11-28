import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { PortfolioPages } from "@/types/application/portfolio/portfolio-pages";
import type { PublishedPortfolio } from "@/types/application/portfolio/published-portfolio";
import { EmptyState, PageBackLink, PageHeader } from "@rede-enois/design-system/ui";
import { Briefcase, UserRound } from "lucide-react";

import { mediaApi, portfolioApi, profileApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { buildShareTags } from "@/lib/open-graph";
import { pageLotOf } from "@/lib/portfolio/portfolio-pages";

import { AppContainer } from "@/components/app-container";
import { PublicPortfolio } from "@/components/portfolio/public-portfolio";

/**
 * As páginas dos PDFs da vitrine. A publicação traz o documento; as páginas dele são mídias do
 * mesmo dono, gravadas em `paginas/<lote>/pagina-<n>.png`, e o lote sai da própria chave.
 */
async function pagesOf(portfolio: PublishedPortfolio): Promise<Map<string, PortfolioPages>> {
  const pages = new Map<string, PortfolioPages>();

  for (const block of portfolio.blocks) {
    if (block.type !== "PDF" || !block.mediaId) continue;
    const asset = await mediaApi.get(block.mediaId).catch(() => null);
    const batch = asset ? pageLotOf(asset) : null;
    if (asset && batch) {
      pages.set(block.mediaId, {
        ownerId: asset.id,
        batch,
        keys: [`paginas/${batch}/pagina-1.png`],
      });
    }
  }

  return pages;
}

/**
 * A vitrine profissional pública: `/portfolio/{username}`.
 *
 * Abre para quem recebeu o link, sem sessão — é conteúdo publicado, como o perfil e o blog. A API
 * responde 404 para perfil inexistente, banido ou que nunca publicou; para quem lê, é a mesma
 * coisa: a vitrine não está no ar.
 */
export const Route = createFileRoute("/portfolio/$username")({
  loader: async ({ params }) => {
    try {
      const [portfolio, profile] = await Promise.all([
        portfolioApi.byUsername(params.username),
        profileApi.get(params.username),
      ]);
      return { portfolio, profile };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => {
    const name = loaderData?.profile.name ?? params.username;
    return {
      meta: buildShareTags({
        title: texts.portfolio.seoTitle(name),
        description: texts.portfolio.seoDescription(name),
        url: `${texts.siteUrl}/portfolio/${encodeURIComponent(params.username)}`,
        imageUrl:
          resolveCdnUrl(loaderData?.profile.avatar) ?? `${texts.siteUrl}/icons/icon-512.png`,
        imageAlt: texts.portfolio.seoTitle(name),
      }),
    };
  },
  notFoundComponent: () => (
    <AppContainer>
      <PageHeader title={texts.portfolio.seoFallbackTitle} icon={Briefcase} />

      <EmptyState icon={Briefcase} title={texts.portfolio.notFound}>
        <PageBackLink href="/">
          <>{texts.profile.backHome}</>
        </PageBackLink>
      </EmptyState>
    </AppContainer>
  ),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { username } = Route.useParams();
  const loaded = Route.useLoaderData();

  // A vitrine e o perfil mudam quando o dono edita; o loader só entrega a primeira pintura.
  const portfolio = useQuery({
    queryKey: ["portfolio", username],
    queryFn: () => portfolioApi.byUsername(username),
    initialData: loaded.portfolio,
  });

  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: () => profileApi.get(username),
    initialData: loaded.profile,
  });

  const current = portfolio.data ?? loaded.portfolio;
  const author = profile.data ?? loaded.profile;

  const pages = useQuery({
    queryKey: ["portfolio-pages", username, current.version],
    queryFn: () => pagesOf(current),
    staleTime: 5 * 60_000,
  });

  return (
    <AppContainer>
      <PageBackLink href={`/perfil/${encodeURIComponent(username)}`} icon={UserRound}>
        <>{texts.portfolio.backToProfile}</>
      </PageBackLink>

      <PublicPortfolio
        portfolio={current}
        username={author.username}
        name={author.name}
        avatarUrl={author.avatar}
        avatarFrame={author.avatarFrame ?? null}
        pages={pages.data ?? new Map()}
      />
    </AppContainer>
  );
}
