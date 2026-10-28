import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { HomeTab } from "@/types/routes/feed/home-tab";
import { PostCardSkeletons } from "@rede-enois/design-system/domain";
import { ArrowLeft } from "lucide-react";

import { feedApi, mediaApi } from "@/lib/api";
import { buildPostShareMeta } from "@/lib/open-graph";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";
import { RichText } from "@/components/post/rich-text";

export const Route = createFileRoute("/post/$postId")({
  validateSearch: (search: Record<string, unknown>): { feedTab?: HomeTab } => ({
    feedTab:
      search.feedTab === "FOR_YOU" ||
      search.feedTab === "ALL" ||
      search.feedTab === "FOLLOWING" ||
      search.feedTab === "RECENT" ||
      search.feedTab === "PROJECTS" ||
      search.feedTab === "CORPORATE"
        ? search.feedTab
        : undefined,
  }),
  // Sem `beforeLoad: requireAuth`: o post e o destino do link compartilhado e precisa abrir para
  // quem recebeu. As acoes (reagir, comentar, salvar, compartilhar) e que pedem login.

  /**
   * O rastreador do WhatsApp/Telegram/X só vê o HTML que sai do servidor: para a miniatura ter o
   * texto do post e a imagem, esses dados precisam estar prontos no `<head>` — por isso a busca
   * acontece no loader (servidor), não no `useQuery` do componente.
   *
   * Link de post apagado ou inexistente cai no título genérico em vez de quebrar a página.
   */
  loader: async ({ params }) => {
    try {
      const post = await feedApi.get(params.postId);
      const firstMediaId = post.mediaIds?.[0];
      // Só a primeira mídia, e só o que a miniatura precisa (tipo + endereço).
      const media = firstMediaId
        ? await mediaApi
            .get(firstMediaId)
            .then((asset) => ({ mimeType: asset.mimeType, cdnUrl: asset.cdnUrl }))
            .catch(() => null)
        : null;
      return { post, media };
    } catch {
      return { post: null, media: null };
    }
  },
  head: ({ loaderData, params }) => {
    const post = loaderData?.post;
    if (!post) {
      return {
        meta: [
          { title: texts.post.seoTitle },
          { name: "description", content: texts.post.seoDescription },
        ],
      };
    }

    const share = buildPostShareMeta({
      post,
      postUrl: `${texts.siteUrl}/post/${params.postId}`,
      fallbackImageUrl: `${texts.siteUrl}/icons/icon-512.png`,
      media: loaderData?.media ?? null,
      // O cartão é gerado pelo backend a partir do texto da página (ver PagePreviewCardService).
      pagePreviewUrl:
        post.type === "PAGE" ? `${texts.siteUrl}/api/pages/${params.postId}/og.png` : null,
    });

    return {
      meta: [
        { title: share.title },
        { name: "description", content: share.description },
        { property: "og:type", content: share.type },
        { property: "og:site_name", content: texts.brand.name },
        { property: "og:title", content: share.title },
        { property: "og:description", content: share.description },
        { property: "og:url", content: share.url },
        { property: "og:image", content: share.imageUrl },
        { property: "og:image:alt", content: share.imageAlt },
        ...(share.videoUrl
          ? [
              { property: "og:video", content: share.videoUrl },
              { property: "og:video:secure_url", content: share.videoUrl },
              { property: "og:video:type", content: "video/mp4" },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: share.title },
        { name: "twitter:description", content: share.description },
        { name: "twitter:image", content: share.imageUrl },
      ],
    };
  },
  component: PostDetail,
});

function PostDetail() {
  const { postId } = Route.useParams();
  const { feedTab } = Route.useSearch();

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => feedApi.get(postId),
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <Link
          to="/feed"
          search={{ aba: feedTab ?? "ALL" }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.post.back}</>
        </Link>

        {isLoading ? (
          <PostCardSkeletons count={1} />
        ) : isError || !post ? (
          <div className="surface-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{texts.post.notFound}</p>
          </div>
        ) : (
          <>
            <PostCard post={post} fullPost />

            {/* Artigo: o corpo vem so na leitura do post unico (a listagem traz o resumo), entao e
                aqui que ele aparece — na mesma largura de leitura do resto. */}
            {post.articleBody && (
              <article className="surface-card p-5 sm:p-8">
                <h2 className="mb-4 text-lg font-normal text-text-strong">
                  {texts.feed.composer.article.bodyLabel}
                </h2>

                <RichText
                  content={post.articleBody}
                  className="whitespace-pre-line break-words text-base font-normal leading-relaxed text-text-strong"
                />
              </article>
            )}
          </>
        )}
      </div>
    </AppContainer>
  );
}
