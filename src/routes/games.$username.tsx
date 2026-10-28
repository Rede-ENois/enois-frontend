import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { GameIcon, UserAvatar, UserBadges } from "@rede-enois/design-system/domain";
import { Button } from "@rede-enois/design-system/ui";
import { ExternalLink, Gamepad2, Users } from "lucide-react";

import { gamesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { safeHref } from "@/lib/safe-url";
import { useAuth } from "@/lib/use-auth";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/games/$username")({
  head: ({ params }) => ({ meta: [{ title: `${params.username} · Jogos · Énóis` }] }),
  component: DeveloperPage,
});

/**
 * /games/$username também é rota-mãe de /games/$username/$gameSlug (a página do jogo): precisa
 * devolver o filho pelo Outlet, senão a página do criador engole o player.
 */
function DeveloperPage() {
  const { username } = Route.useParams();
  const matchRoute = useMatchRoute();
  return matchRoute({ to: "/games/$username", params: { username }, fuzzy: false }) ? (
    <CreatorPage />
  ) : (
    <Outlet />
  );
}

/**
 * A página do criador.
 *
 * Não é uma segunda identidade: nome, @, foto e emblema vêm do perfil do Énóis, e o que é do Games
 * (nome de estúdio, chamada, bio, links) fica ao lado. Quem não preencheu nada e não tem jogo
 * publicado não ganha página — o backend devolve 404 em vez de mostrar um perfil vazio.
 */
function CreatorPage() {
  const { username } = Route.useParams();
  const { requireAuth } = useAuth();
  const queryClient = useQueryClient();

  const developer = useQuery({
    queryKey: ["games", "developer", username],
    queryFn: () => gamesApi.developer(username),
  });

  const follow = useMutation({
    mutationFn: (following: boolean) =>
      following ? gamesApi.unfollow(username) : gamesApi.follow(username),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["games", "developer", username] }),
  });

  if (developer.isLoading) {
    return (
      <AppContainer>
        <p className="py-10 text-center text-sm text-text-subtle">{texts.games.loading}</p>
      </AppContainer>
    );
  }

  if (developer.isError || !developer.data) {
    return (
      <AppContainer>
        <div className="surface-card mx-auto max-w-2xl p-8 text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-primary" />

          <p className="mt-3 text-sm font-medium text-text-strong">
            {texts.games.developer.notFound}
          </p>

          <Link to="/games" className="mt-2 inline-block text-sm text-primary hover:underline">
            {texts.games.title}
          </Link>
        </div>
      </AppContainer>
    );
  }

  const dev = developer.data;

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="surface-card overflow-hidden">
          {/* resolveCdnUrl: a capa pode ser relativa (arquivo nosso) — sem isso ela não abria. */}
          {dev.cover ? (
            <img
              src={resolveCdnUrl(dev.cover)}
              alt=""
              className="h-32 w-full object-cover sm:h-40"
            />
          ) : (
            <div className="h-20 w-full bg-primary-soft" />
          )}

          <div className="flex flex-wrap items-start gap-3 p-4 sm:p-5">
            <UserAvatar
              src={dev.avatar ?? undefined}
              alt={dev.name}
              className="-mt-10 h-16 w-16 shrink-0 ring-4 ring-surface-card"
            />

            <div className="min-w-0 flex-1">
              <h1 className="flex min-w-0 flex-wrap items-center gap-1.5 break-words text-xl font-semibold tracking-tight text-text-strong">
                <>{dev.displayName || dev.name}</>

                <UserBadges badges={dev.badges} badge={dev.badge} />
              </h1>

              <p className="break-words text-sm text-text-subtle">
                @{dev.username} · {texts.games.developer.games(dev.games.length)} ·{" "}
                {texts.games.developer.followers(dev.followers)}
              </p>

              {dev.headline && (
                <p className="mt-1 text-sm font-normal text-text-strong">{dev.headline}</p>
              )}
            </div>

            {dev.owner ? (
              <Link to="/games/painel">
                <Button variant="outline" size="sm" className="rounded-full">
                  {texts.games.developer.editPage}
                </Button>
              </Link>
            ) : (
              <Button
                variant={dev.following ? "outline" : "default"}
                size="sm"
                className="rounded-full gap-1.5"
                disabled={follow.isPending}
                onClick={() => {
                  if (!requireAuth()) return;
                  follow.mutate(dev.following);
                }}
              >
                <Users className="h-3.5 w-3.5" />

                <>
                  {dev.following ? texts.games.developer.following : texts.games.developer.follow}
                </>
              </Button>
            )}
          </div>

          {dev.bio && (
            <p className="whitespace-pre-line border-t border-border-soft px-4 py-3 text-sm font-normal text-muted-foreground sm:px-5">
              {dev.bio}
            </p>
          )}

          {dev.links.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border-soft px-4 py-3 sm:px-5">
              {dev.links
                .map(safeHref)
                .filter((link): link is string => link !== null)
                .map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-soft px-2.5 py-1 text-xs font-normal text-text-subtle transition hover:border-primary/40 hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />

                    <>{link.replace(/^https?:\/\//, "").replace(/\/$/, "")}</>
                  </a>
                ))}
            </div>
          )}
        </div>

        {dev.games.length === 0 ? (
          <p className="surface-card p-8 text-center text-sm font-normal text-text-subtle">
            {texts.games.developer.noGames}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {dev.games.map((game) => (
              <li key={game.id}>
                <Link
                  to="/games/$username/$gameSlug"
                  params={{ username: dev.username, gameSlug: game.slug }}
                  className="surface-card flex items-center gap-3 p-3 transition hover:border-primary"
                >
                  <GameIcon cover={game.cover} icon={game.icon} url={game.url} />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-text-strong">
                      {game.title}
                    </span>

                    <span className="block truncate text-sm text-text-subtle">
                      {game.shortDescription || game.description || " "}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppContainer>
  );
}
