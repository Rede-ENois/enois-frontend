import { useQuery } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { HomeTab } from "@/types/routes/feed/home-tab";
import { PortfolioPointer as PortfolioPointerView } from "@rede-enois/design-system/domain";

import { portfolioApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { saveFeedScroll } from "@/lib/feed-scroll-restoration";
import { headlineOf, portfolioHref, titleOf } from "@/lib/portfolio/portfolio-teaser";

/**
 * O resumo da vitrine que um post PORTFOLIO aponta, para o card do feed.
 *
 * O post é o ponteiro: o conteúdo mora em `/portfolio/{username}`, e a leitura é a mesma de
 * qualquer visita. Sem publicação (404), o card fica sem o resumo e o "Abrir vitrine" continua
 * apontando para o endereço; com a leitura falhando, o quadro sai do card em vez de ficar piscando.
 */
export function PortfolioPointer({
  post,
  feedTab,
}: {
  post: PostView;
  /** A aba do feed de onde o card está: a volta da vitrine usa a mesma rolagem. */
  feedTab?: HomeTab;
}) {
  const live = useQuery({
    queryKey: ["portfolio-live", post.authorUsername],
    queryFn: async () => {
      try {
        const portfolio = await portfolioApi.byUsername(post.authorUsername);
        return { title: titleOf(portfolio.html), headline: headlineOf(portfolio.html, 200) };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    staleTime: 60_000,
  });

  if (live.isPending) {
    return (
      <PortfolioPointerView
        name={post.authorName}
        avatarUrl={post.authorAvatar}
        headline={null}
        href={portfolioHref(post.authorUsername)}
        loading
      />
    );
  }

  const teaser = live.data;
  if (!teaser) return null;

  return (
    <PortfolioPointerView
      name={post.authorName}
      avatarUrl={post.authorAvatar}
      title={teaser.title}
      headline={teaser.headline}
      href={portfolioHref(post.authorUsername)}
      onNavigate={
        feedTab
          ? () => saveFeedScroll({ tab: feedTab, postId: post.id, scrollY: window.scrollY })
          : undefined
      }
    />
  );
}
