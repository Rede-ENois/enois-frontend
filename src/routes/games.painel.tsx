import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { GameView } from "@/types/application/games/game-view";
import { BarChart3, Newspaper, Pencil, X } from "lucide-react";

import { gamesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { requireAuth } from "@/lib/require-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { GameIcon } from "@/components/game-icon";
import { GameAnalyticsCard } from "@/components/games/game-analytics-card";
import { GameEditorDialog } from "@/components/games/game-editor-dialog";
import { GameUpdateDialog } from "@/components/games/game-update-dialog";

export const Route = createFileRoute("/games/painel")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: `${texts.games.panel.title} · Énóis` }] }),
  component: StudioPanel,
});

/**
 * O painel de quem publica.
 *
 * Três coisas: a página do criador (o que o público lê — texto, foto e capa), a administração de
 * cada jogo (editar a ficha, o endereço, ícone e banner; excluir; publicar novidade) e os números
 * de uso, que só o dono vê.
 */
function StudioPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const avatarUpload = useMediaUpload();
  const coverUpload = useMediaUpload();

  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [editing, setEditing] = useState<GameView | null>(null);
  const [updating, setUpdating] = useState<GameView | null>(null);
  const [analyticsFor, setAnalyticsFor] = useState<string | null>(null);

  const mine = useQuery({ queryKey: ["games", "mine"], queryFn: () => gamesApi.mine() });
  // A PRÓPRIA página: antes o painel pedia `/games/me/profile` (um @ que não existe) e o
  // formulário abria vazio — quem já tinha texto digitado via tudo em branco.
  const developer = useQuery({
    queryKey: ["games", "developer", "me"],
    queryFn: () => gamesApi.myDeveloperPage(),
  });

  useEffect(() => {
    const profile = developer.data;
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setHeadline(profile.headline ?? "");
    setBio(profile.bio ?? "");
    setLinks(profile.links.join(", "));
    setAvatar(profile.avatar ?? null);
    setCover(profile.cover ?? null);
  }, [developer.data]);

  const save = useMutation({
    mutationFn: () =>
      gamesApi.saveDeveloper({
        displayName: displayName.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        links: links.trim() || null,
        avatar,
        cover,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["games"] });
      toast(texts.games.panel.saved, "success");
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.games.panel.error, "error"),
  });

  async function uploadProfileImage(kind: "avatar" | "cover", file: File | null | undefined) {
    if (!file) return;
    try {
      const uploader = kind === "avatar" ? avatarUpload : coverUpload;
      const result = await uploader.upload(file, kind === "avatar" ? "AVATAR" : "BANNER");
      if (kind === "avatar") setAvatar(result.cdnUrl);
      else setCover(result.cdnUrl);
    } catch (error) {
      toast(error instanceof Error ? error.message : texts.games.panel.uploadError, "error");
    }
  }

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{texts.games.panel.title}</h1>

          <p className="mt-1 text-sm text-text-subtle">{texts.games.panel.description}</p>
        </header>

        <section className="surface-card space-y-3 p-4 sm:p-5">
          <h2 className="text-base font-medium">{texts.games.panel.profileTitle}</h2>

          {/* Foto e capa da página do criador: as mesmas do perfil quando vazias. */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="relative">
              {avatar ? (
                <img
                  src={resolveCdnUrl(avatar)}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                // Sem foto própria, a página cai na do perfil: a inicial é só o marcador daqui.
                <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-lg font-medium text-primary-text">
                  {(displayName.trim() || developer.data?.name || "?").slice(0, 1).toUpperCase()}
                </span>
              )}

              {avatar && (
                <button
                  type="button"
                  aria-label={texts.games.panel.removeAvatar}
                  title={texts.games.panel.removeAvatar}
                  onClick={() => setAvatar(null)}
                  className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>

            <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border-soft px-3 text-sm font-medium transition hover:bg-muted">
              {avatarUpload.status === "uploading"
                ? texts.common.loading
                : texts.games.panel.uploadAvatar}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void uploadProfileImage("avatar", file);
                }}
              />
            </label>

            <p className="basis-full text-xs text-text-subtle">{texts.games.panel.avatarHint}</p>
          </div>

          <div className="space-y-2">
            {cover ? (
              <span className="relative block">
                <img
                  src={resolveCdnUrl(cover)}
                  alt=""
                  className="h-24 w-full rounded-xl object-cover"
                />

                <button
                  type="button"
                  aria-label={texts.games.panel.removeCover}
                  title={texts.games.panel.removeCover}
                  onClick={() => setCover(null)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border-soft px-3 text-sm font-medium transition hover:bg-muted">
                {coverUpload.status === "uploading"
                  ? texts.common.loading
                  : texts.games.panel.uploadCover}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void uploadProfileImage("cover", file);
                  }}
                />
              </label>

              <p className="text-xs text-text-subtle">{texts.games.panel.coverHint}</p>
            </div>
          </div>

          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={texts.games.panel.displayName}
            maxLength={120}
          />
          <Input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder={texts.games.panel.headline}
            maxLength={200}
          />
          <Textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder={texts.games.panel.bio}
            maxLength={2000}
            className="min-h-[120px]"
          />
          <Input
            value={links}
            onChange={(event) => setLinks(event.target.value)}
            placeholder={texts.games.panel.links}
            maxLength={500}
          />

          <div className="flex justify-end">
            <Button
              className="rounded-full"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? texts.common.saving : texts.common.save}
            </Button>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium">{texts.games.panel.gamesTitle}</h2>

          {mine.isLoading ? (
            <p className="surface-card p-6 text-center text-sm font-normal text-text-subtle">
              {texts.common.loading}
            </p>
          ) : (mine.data?.length ?? 0) === 0 ? (
            <p className="surface-card p-6 text-center text-sm font-normal text-text-subtle">
              {texts.games.panel.noGames}
            </p>
          ) : (
            <ul className="space-y-2">
              {mine.data!.map((game) => (
                <li key={game.id} className="surface-card space-y-2 p-3">
                  <div className="flex items-center gap-3">
                    <GameIcon
                      icon={game.icon}
                      cover={game.cover}
                      url={game.url}
                      className="h-10 w-10"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-strong">{game.title}</p>

                      <p className="truncate text-xs text-text-subtle">
                        {texts.games.panel.status[game.status]}
                        {game.reviewNote ? ` · ${game.reviewNote}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {game.status === "PUBLISHED" && (
                      <Link
                        to="/games/$username/$gameSlug"
                        params={{ username: game.username ?? "", gameSlug: game.slug }}
                        className="text-sm text-primary hover:underline"
                      >
                        {texts.games.panel.view}
                      </Link>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => setEditing(game)}
                    >
                      <Pencil className="h-3.5 w-3.5" />

                      <>{texts.games.panel.edit}</>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() =>
                        setAnalyticsFor((current) => (current === game.id ? null : game.id))
                      }
                    >
                      <BarChart3 className="h-3.5 w-3.5" />

                      <>{texts.games.panel.analytics}</>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => setUpdating(game)}
                    >
                      <Newspaper className="h-3.5 w-3.5" />

                      <>{texts.games.panel.newUpdate}</>
                    </Button>
                  </div>

                  {analyticsFor === game.id && <GameAnalyticsCard gameId={game.id} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editing && (
        <GameEditorDialog
          game={editing}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      {updating && (
        <GameUpdateDialog
          game={updating}
          open={updating !== null}
          onOpenChange={(open) => !open && setUpdating(null)}
        />
      )}
    </AppContainer>
  );
}
