import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CorporateProfileView } from "@/types/application/corporate/corporate-profile-view";
import {
  PostCardSkeletons,
  ProfessionalProfile as ProfessionalProfileView,
} from "@rede-enois/design-system/domain";
import { Button, EmptyState, useToast } from "@rede-enois/design-system/ui";
import { ArrowLeft, Globe, MessageCircle, UserX } from "lucide-react";

import { ApiError, corporateApi, feedApi, messagesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { conversationErrorMessage } from "@/lib/conversation-error";
import { monthsBetween, partesDaData, shortMonthYear } from "@/lib/date/format";
import { litePageSize } from "@/lib/lite-mode";
import { safeHref } from "@/lib/safe-url";
import { ogMetas } from "@/lib/seo";
import { useAuth } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const openConversation = useMutation({
    mutationFn: (userId: string) => messagesApi.openBusinessDirect(userId),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/mensagens", search: { conversation: conversation.id } });
    },
    onError: (err) => toast(conversationErrorMessage(err), "error"),
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

  return (
    <AppContainer>
      <ProfessionalProfileView
        backHref="/feed"
        editHref={isMine ? "/profissional" : null}
        statusNote={data.status !== "ACTIVE" ? texts.corporate.status[data.status] : null}
        banner={
          data.bannerHtml ? (
            <SandboxedHtmlFrame
              html={data.bannerHtml}
              title={texts.corporate.bannerHtml}
              className="h-full w-full"
            />
          ) : data.banner ? (
            <img src={resolveCdnUrl(data.banner)} alt="" className="h-full w-full object-cover" />
          ) : null
        }
        profile={{
          name: data.name,
          username: data.username,
          headline: data.headline,
          bio: data.bio,
          avatar: data.avatar,
          location: data.location,
          industry: data.industry,
          identityVerified: data.identityVerified,
          reputation: data.reputation ?? null,
          memberSinceLabel: data.memberSince ? shortMonthYear(data.memberSince) : null,
          skills: data.skills ?? [],
          links: splitLinks(data.externalLinks)
            .map(safeHref)
            .filter((link): link is string => link !== null),
        }}
        experiences={sortCurrentFirst(data.experiences ?? []).map((item) => ({
          ...item,
          startLabel: item.startDate ? shortMonthYear(item.startDate) : null,
          endLabel: item.endDate ? shortMonthYear(item.endDate) : null,
          months: item.startDate ? monthsBetween(item.startDate, item.endDate) : null,
        }))}
        educations={sortCurrentFirst(data.educations ?? []).map((item) => ({
          id: item.id,
          school: item.school,
          degree: item.degree,
          field: item.field,
          periodLabel: yearsLabel(item.startDate, item.currentlyHere ? null : item.endDate),
        }))}
        certifications={(data.certifications ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          issuer: item.issuer,
          issuedLabel: item.issueDate ? shortMonthYear(item.issueDate) : null,
          credentialUrl: item.credentialUrl ? safeHref(item.credentialUrl) : null,
        }))}
        posts={
          <>
            {!isMine && user && data.userId && (
              <div className="mb-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => openConversation.mutate(data.userId!)}
                  disabled={openConversation.isPending}
                >
                  <MessageCircle className="h-4 w-4" />

                  <>{texts.profile.message}</>
                </Button>
              </div>
            )}

            {posts.isLoading ? (
              <PostCardSkeletons />
            ) : posts.isError ? (
              <div className="surface-card">
                <EmptyState icon={Globe} title={texts.corporate.saveError} />
              </div>
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
          </>
        }
      />
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

/** "2016 a 2020", "2024 até o momento" (sem fim) ou `null` sem datas. */
function yearsLabel(start: string | null, end: string | null): string | null {
  const from = start ? partesDaData(start)?.ano : undefined;
  const to = end ? partesDaData(end)?.ano : undefined;
  if (from && to) return from === to ? `${from}` : `${from} a ${to}`;
  if (from) return `${from} até o momento`;
  return to ? `${to}` : null;
}

/** "Atualmente aqui" primeiro; depois as mais recentes pela data de início. */
function sortCurrentFirst<T extends { currentlyHere: boolean; startDate: string | null }>(
  list: T[],
): T[] {
  return [...list].sort((a, b) => {
    if (a.currentlyHere !== b.currentlyHere) return a.currentlyHere ? -1 : 1;
    return (b.startDate ?? "").localeCompare(a.startDate ?? "");
  });
}

/** O campo é texto livre separado por vírgula/linha; só vira link o que parece URL. */
function splitLinks(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter((part) => /^https?:\/\//i.test(part));
}
