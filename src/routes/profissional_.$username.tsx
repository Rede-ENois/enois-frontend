import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CorporateProfileView } from "@/types/application/corporate/corporate-profile-view";
import { ArrowLeft, Building2, Globe, Link as LinkIcon, MapPin, UserX } from "lucide-react";

import { ApiError, corporateApi, feedApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { litePageSize } from "@/lib/lite-mode";
import { ogMetas } from "@/lib/seo";
import { useAuth } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { PostCardSkeletons } from "@/components/skeletons/post-card-skeletons";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/profissional_/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username} · ${texts.corporate.seoTitle}` },
      { name: "description", content: texts.corporate.subtitle },
      ...ogMetas(`${params.username} · ${texts.corporate.seoTitle}`, texts.corporate.subtitle),
    ],
  }),
  component: ProfessionalProfile,
});

const PAGE_SIZE = 20;

/**
 * Página pública do perfil profissional: a apresentação de trabalho e SÓ as publicações
 * BUSINESS daquele @. Perfil desativado/inexistente responde 404 no backend e aqui vira
 * um estado vazio, nunca uma página quebrada.
 */
function ProfessionalProfile() {
  const lite = useLiteMode();
  const { username } = Route.useParams();
  const { user } = useAuth();

  const profile = useQuery({
    queryKey: ["corporate-public", username],
    queryFn: () => corporateApi.byUsername(username),
    retry: false,
  });

  const myProfile = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => corporateApi.me(),
    enabled: Boolean(user),
  });

  const posts = useInfiniteQuery({
    queryKey: ["corporate-public", username, "posts"],
    queryFn: ({ pageParam }) =>
      feedApi.corporateByUsername(username, pageParam, litePageSize(PAGE_SIZE, lite)),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: profile.isSuccess,
  });

  if (profile.isLoading) {
    return <PageSkeleton />;
  }

  if (profile.isError) {
    const notFound = profile.error instanceof ApiError && profile.error.status === 404;
    return (
      <AppContainer>
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <BackToFeed />

          <div className="surface-card">
            <EmptyState
              icon={UserX}
              title={texts.corporate.publicProfile.notFoundTitle}
              description={
                notFound ? texts.corporate.publicProfile.notFoundBody : texts.corporate.saveError
              }
            />
          </div>
        </div>
      </AppContainer>
    );
  }

  const data = profile.data as CorporateProfileView;
  const items = posts.data?.pages.flatMap((page) => page.items) ?? [];
  const isMine = Boolean(myProfile.data?.exists && myProfile.data.username === data.username);
  const links = splitLinks(data.externalLinks);

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackToFeed />

        <div className="surface-card overflow-hidden p-0">
          {data.bannerHtml ? (
            <SandboxedHtmlFrame
              html={data.bannerHtml}
              title={texts.corporate.bannerHtml}
              className="h-36 w-full sm:h-44"
            />
          ) : data.banner ? (
            <div className="h-36 w-full bg-surface-2 sm:h-44">
              <img src={resolveCdnUrl(data.banner)} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-24 w-full bg-gradient-to-r from-primary/20 via-surface-2 to-surface-1 sm:h-28" />
          )}

          <div className="space-y-4 p-4 sm:p-6">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14">
              <UserAvatar
                src={data.avatar || undefined}
                alt={data.name}
                className="h-20 w-20 border-4 border-surface-card sm:h-24 sm:w-24"
              />

              {isMine && (
                <Link to="/profissional">
                  <Button className="w-auto rounded-full" variant="outline">
                    {texts.corporate.publicProfile.editMine}
                  </Button>
                </Link>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="break-words text-2xl font-semibold tracking-tight">{data.name}</h1>

              <p className="text-sm text-text-subtle">@{data.username}</p>

              {data.headline && (
                <p className="break-words text-sm text-text-strong">{data.headline}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
              {data.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {data.location}
                </span>
              )}

              {data.industry && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {data.industry}
                </span>
              )}
            </div>

            {data.bio && (
              <p className="whitespace-pre-line break-words text-sm text-text-strong">{data.bio}</p>
            )}

            {links.length > 0 && (
              <ul className="space-y-1">
                {links.map((link) => (
                  <li key={link} className="flex items-center gap-1.5 text-sm">
                    <LinkIcon className="h-3.5 w-3.5 text-text-subtle" />

                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="truncate text-primary hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {data.status !== "ACTIVE" && (
              <p className="text-xs text-text-subtle">{texts.corporate.status[data.status]}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{texts.corporate.publicProfile.postsTitle}</h2>

          {posts.isLoading ? (
            <PostCardSkeletons />
          ) : items.length === 0 ? (
            <div className="surface-card">
              <EmptyState icon={Globe} title={texts.corporate.publicProfile.empty} />
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {posts.hasNextPage && (
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  disabled={posts.isFetchingNextPage}
                  onClick={() => void posts.fetchNextPage()}
                >
                  {texts.feed.loadMore}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppContainer>
  );
}

function BackToFeed() {
  return (
    <Link
      to="/feed"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />

      <>{texts.corporate.publicProfile.backToFeed}</>
    </Link>
  );
}

/** O campo é texto livre separado por vírgula/linha; só vira link o que parece URL. */
function splitLinks(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter((part) => /^https?:\/\//i.test(part));
}
