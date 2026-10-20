import { type CSSProperties, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import {
  Bookmark,
  ExternalLink,
  Gamepad2,
  Loader2,
  Maximize2,
  Newspaper,
  Pencil,
  Share2,
  Sparkles,
} from "lucide-react";

import { gamesApi, mediaApi } from "@/lib/api";
import { formatFaisca } from "@/lib/faisca";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { GameIcon } from "@/components/game-icon";
import { GameBanner } from "@/components/games/game-banner";
import { GameCommentsSection } from "@/components/games/game-comments-section";
import { GameEditorDialog } from "@/components/games/game-editor-dialog";
import { GameReviewsSection } from "@/components/games/game-reviews-section";
import { GameUpdateDialog } from "@/components/games/game-update-dialog";

/** A proporção do quadro, escolhida pelo criador (o jogo decide como quer aparecer). */
const ASPECT: Record<string, string> = {
  WIDESCREEN: "16 / 9",
  CLASSIC: "4 / 3",
  SQUARE: "1 / 1",
  PORTRAIT: "9 / 16",
};

const STAGE_LABEL: Record<string, string> = {
  IN_DEVELOPMENT: "Em desenvolvimento",
  DEMO: "Demo",
  EARLY_ACCESS: "Acesso antecipado",
  RELEASED: "Lançado",
  PAUSED: "Pausado",
};

export const Route = createFileRoute("/games/$username/$gameSlug")({
  head: ({ params }) => ({ meta: [{ title: `${params.gameSlug} · Jogos · Énóis` }] }),
  component: GamePage,
});

/**
 * A página do jogo e o player.
 *
 * O Énóis NÃO hospeda: o quadro carrega o endereço onde o criador publicou, com sandbox mínimo e
 * tela cheia explícita. O que a tela garante: **nenhum botão mente sobre o estado do jogo** (jogo
 * fora do ar não aparece como jogável), a sessão é contada pelo servidor quando alguém aperta jogar,
 * e o site de origem pode recusar o quadro — aí a tela explica e oferece abrir na origem em vez de
 * fingir que o jogo quebrou.
 */
function GamePage() {
  const { username, gameSlug } = Route.useParams();
  const { requireAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newUpdate, setNewUpdate] = useState(false);
  // A dica de tela cheia no celular é um aviso, não conteúdo: some sozinha depois de 3s.
  const [showMobileHint, setShowMobileHint] = useState(true);
  const frame = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();

  const game = useQuery({
    queryKey: ["games", "slug", username, gameSlug],
    queryFn: () => gamesApi.bySlug(username, gameSlug),
  });

  const updates = useQuery({
    queryKey: ["games", "updates", game.data?.id],
    queryFn: () => gamesApi.updates(game.data!.id),
    enabled: Boolean(game.data?.id),
  });

  // "Pessoas que jogaram" é DISTINTO (o backend conta quem jogou uma vez): a linha de números
  // mostrava `plays` nos dois lugares, o que dizia que cada sessão era uma pessoa nova.
  const stats = useQuery({
    queryKey: ["games", "stats", game.data?.id],
    queryFn: () => gamesApi.stats(game.data!.id),
    enabled: Boolean(game.data?.id),
  });

  const play = useMutation({
    mutationFn: (gameId: string) => gamesApi.play(gameId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["games", "slug", username, gameSlug] }),
  });

  // A identidade do jogo é emitida ao começar a jogar (o iframe recebe por postMessage).
  const emitirIdentidade = useMutation({
    mutationFn: (gameId: string) => gamesApi.identity(gameId),
    onSuccess: (dados) => setIdentidade(dados.token),
  });

  const confirmarGasto = useMutation({
    mutationFn: () => gamesApi.spend(g.id, gasto!.amount, gasto!.motivo, gasto!.requestId),
    onSuccess: () => {
      setGasto(null);
      toast("Gasto confirmado — as faíscas saíram da sua carteira.", "success");
      void queryClient.invalidateQueries({ queryKey: ["carteira"] });
    },
    onError: () => toast("Não foi possível confirmar o gasto agora.", "error"),
  });

  const favorite = useMutation({
    mutationFn: (vars: { gameId: string; favorited: boolean }) =>
      vars.favorited ? gamesApi.unfavorite(vars.gameId) : gamesApi.favorite(vars.gameId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["games", "slug", username, gameSlug] }),
  });

  // Publica a conquista: a imagem (dataURL do jogo) sobe pela mídia normal e o post leva as
  // tags do jogo. O clique aqui é o que publica — o jogo só pede.
  const compartilhar = useMutation({
    mutationFn: async ({
      gameId,
      texto,
      imagem,
    }: {
      gameId: string;
      texto: string;
      imagem: string | null;
    }) => {
      let mediaIds: string[] = [];
      if (imagem) {
        const blob = await (await fetch(imagem)).blob();
        const arquivo = new File([blob], "conquista.png", { type: blob.type || "image/png" });
        const resultado = await mediaApi.requestUpload({
          fileName: `media/${crypto.randomUUID()}/conquista.png`,
          mimeType: arquivo.type,
          size: arquivo.size,
          purpose: "POST_IMAGE",
        });
        if (resultado.provider !== "S3") {
          throw new Error(
            "O envio de mídia está temporariamente desativado enquanto o armazenamento é migrado.",
          );
        }
        await mediaApi.uploadToSignedUrl(
          resultado.uploadUrl,
          arquivo,
          resultado.uploadHeaders ?? {},
        );
        mediaIds = [resultado.id];
      }
      return gamesApi.compartilhar(gameId, texto, mediaIds);
    },
    onSuccess: () => {
      setCompartilhamento(null);
      toast("Conquista publicada no seu feed!", "success");
    },
    onError: () => toast("Não foi possível publicar a conquista agora.", "error"),
  });

  // NÃO desmontar o iframe por tempo: o quadro não avisa quando o site recusa incorporação, mas
  // também não avisa quando o jogo está carregando. O timer de 12s derrubava jogos que já estavam
  // rodando (no celular o carregamento passa fácil disso) e parecia um crash do player. Quem
  // recusar o quadro fica com a saída sempre visível no rodapé: "Abrir no site do criador".

  const [compartilhamento, setCompartilhamento] = useState<{
    texto: string;
    imagem: string | null;
  } | null>(null);
  const [identidade, setIdentidade] = useState<string | null>(null);
  const [gasto, setGasto] = useState<{ amount: number; motivo: string; requestId: string } | null>(
    null,
  );

  // O contador começa quando o JOGO carrega (a dica só existe dentro do card). Se começasse no
  // mount, o fetch podia demorar mais que 3s e a pessoa nunca via o aviso.
  useEffect(() => {
    if (!game.data) return;
    setShowMobileHint(true);
    const timer = window.setTimeout(() => setShowMobileHint(false), 3000);
    return () => window.clearTimeout(timer);
  }, [game.data]);

  // G-share: o jogo (iframe de OUTRA origem, sem sessão nenhuma) pede o compartilhamento por
  // postMessage; a página valida a origem contra o endereço registrado do jogo, mostra a PRÉVIA
  // e só publica com o clique da pessoa — o texto/mídia entram no feed dela, a sessão nunca
  // atravessa a borda do quadro. Protocolo: { type: "enois:share", texto, imagem? }.
  useEffect(() => {
    if (!playing || !game.data?.url) return;
    let origemDoJogo = "";
    try {
      origemDoJogo = new URL(game.data.url).origin;
    } catch {
      return;
    }
    const listener = (e: MessageEvent) => {
      if (e.origin !== origemDoJogo) return;
      const dado = e.data as {
        type?: string;
        texto?: unknown;
        imagem?: unknown;
        amount?: unknown;
        motivo?: unknown;
        requestId?: unknown;
      };
      // O jogo PEDE a identidade (ele nunca recebe a sessão): respondemos só com o token opaco.
      if (dado?.type === "enois:identity") {
        if (identidade && e.source) {
          (e.source as Window).postMessage({ type: "enois:identity", token: identidade }, e.origin);
        }
        return;
      }
      // O jogo PEDE um gasto: NADA sai daqui sem a pessoa confirmar na plataforma.
      if (
        dado?.type === "enois:spend" &&
        typeof dado.amount === "number" &&
        typeof dado.requestId === "string"
      ) {
        if (dado.amount > 0 && Number.isSafeInteger(dado.amount)) {
          setGasto({
            amount: dado.amount,
            motivo: typeof dado.motivo === "string" ? dado.motivo.slice(0, 200) : "",
            requestId: dado.requestId.slice(0, 120),
          });
        }
        return;
      }
      if (dado?.type !== "enois:share" || typeof dado.texto !== "string") return;
      const imagem =
        typeof dado.imagem === "string" && dado.imagem.startsWith("data:image/")
          ? dado.imagem
          : null;
      setCompartilhamento({ texto: dado.texto.slice(0, 600), imagem });
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [playing, game.data?.url, identidade]);

  if (game.isLoading) {
    return (
      <AppContainer>
        <p className="py-10 text-center text-sm text-text-subtle">{texts.games.loading}</p>
      </AppContainer>
    );
  }

  if (game.isError || !game.data) {
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

  const g = game.data;
  const playable = g.status === "PUBLISHED";
  const gallery = [g.cover, ...g.mediaIds].filter(Boolean) as string[];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <p className="text-sm text-text-subtle">
          <Link to="/games" className="hover:underline">
            {texts.games.title}
          </Link>
          {" / "}
          <Link to="/games/$username" params={{ username }} className="hover:underline">
            {username}
          </Link>
        </p>

        {/* Banner do criador: foto ou HTML/CSS (a foto vence). */}
        <GameBanner banner={g.banner} bannerHtml={g.bannerHtml} title={g.title} />

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <GameIcon icon={g.icon} cover={g.cover} url={g.url} className="h-14 w-14" />

            <div className="min-w-0">
              <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-text-strong">
                {g.title}
              </h1>

              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-subtle">
                <Link
                  to="/games/$username"
                  params={{ username }}
                  className="font-medium text-primary hover:underline"
                >
                  {g.username ?? username}
                </Link>

                <span className="rounded-full border border-border-soft px-2 py-0.5 text-xs">
                  {STAGE_LABEL[g.stage] ?? g.stage}
                </span>

                <span className="rounded-full border border-border-soft px-2 py-0.5 text-xs">
                  {g.distribution === "PAID"
                    ? texts.games.game.priceSoon(g.priceCoins)
                    : texts.games.game.free}
                </span>

                {g.version && (
                  <span className="text-xs">{texts.games.game.version(g.version)}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {/* Dono: editar a ficha/identidade e publicar novidade daqui mesmo. */}
            {g.owned && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />

                  <>{texts.games.panel.edit}</>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => setNewUpdate(true)}
                >
                  <Newspaper className="h-3.5 w-3.5" />

                  <>{texts.games.panel.newUpdate}</>
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className={cn("rounded-full gap-1.5", g.favorited && "text-primary")}
              disabled={favorite.isPending}
              onClick={() => {
                if (!requireAuth()) return;
                favorite.mutate({ gameId: g.id, favorited: g.favorited });
              }}
            >
              <Bookmark className="h-3.5 w-3.5" />

              <>{g.favorited ? texts.games.game.unfavorite : texts.games.game.favorite}</>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              onClick={async () => {
                const url = `${window.location.origin}/games/${g.username ?? username}/${g.slug}`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast(texts.games.game.shareCopied, "success");
                } catch {
                  toast(texts.games.game.shareCopied, "error");
                }
              }}
            >
              <Share2 className="h-3.5 w-3.5" />

              <>{texts.games.share}</>
            </Button>
          </div>
        </header>

        {!playable && (
          <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {g.status === "SUSPENDED" ? texts.games.game.suspended : texts.games.game.notPublished}
          </p>
        )}

        {/* O player: clique para jogar (nada roda sozinho), proporção do criador e tela cheia. */}
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
          {/* No celular o quadro 16:9 fica com ~200px de altura e o menu do jogo não cabe (o
              botão de iniciar sai da tela). Por isso, em telas pequenas, ele usa 70% da altura e
              volta à proporção do criador a partir de sm. */}
          <div
            className="relative w-full max-sm:h-[70svh] max-sm:min-h-80 sm:aspect-[var(--game-aspect)]"
            style={{ "--game-aspect": ASPECT[g.aspect] ?? "16 / 9" } as CSSProperties}
          >
            {playing && playable && !failed ? (
              <iframe
                ref={frame}
                src={g.url}
                title={g.title}
                className="h-full w-full border-0"
                allow="fullscreen; gamepad; autoplay"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                referrerPolicy="no-referrer"
              />
            ) : (
              <button
                type="button"
                className="grid h-full w-full place-items-center bg-primary-soft text-center"
                disabled={!playable}
                onClick={() => {
                  setPlaying(true);
                  setFailed(false);
                  play.mutate(g.id);
                  emitirIdentidade.mutate(g.id);
                }}
              >
                <span>
                  {failed ? (
                    <>
                      <p className="mx-auto max-w-sm px-4 text-sm text-text-strong">
                        {texts.games.game.blocked}
                      </p>

                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                        <ExternalLink className="h-4 w-4" />

                        <>{texts.games.game.openAtOrigin}</>
                      </span>
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="mx-auto h-10 w-10 text-primary-text" />

                      <span className="mt-2 block text-sm font-medium text-primary-text">
                        {texts.games.game.play}
                      </span>

                      {/* Sobre o bg-primary-soft, o texto sutil pode ficar abaixo de 3:1 em temas
                          de soft escuro (silver-jonny dava 2.8:1); o primary-text é calculado
                          justamente contra esse fundo. */}
                      <span className="mt-1 block text-xs text-primary-text">
                        {texts.games.game.external}
                      </span>
                    </>
                  )}
                </span>
              </button>
            )}
          </div>

          {showMobileHint && (
            <p className="border-t border-border-soft px-3 py-2 text-xs text-text-subtle sm:hidden">
              {texts.games.game.mobileHint}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft px-3 py-2">
            <p className="text-xs text-text-subtle">
              {/* Jogadores DISTINTOS vêm de /stats (o `g.plays` é o total de sessões). */}
              {texts.games.game.stats(g.plays, Number(stats.data?.players ?? 0))}
              {g.favorites > 0 && ` · ${texts.games.game.favorites(g.favorites)}`}
            </p>

            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full gap-1.5 text-xs"
                onClick={() => {
                  setFailed(false);
                  setPlaying(true);
                }}
              >
                {play.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Gamepad2 className="h-3.5 w-3.5" />
                )}

                <>{texts.games.game.retry}</>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="rounded-full gap-1.5 text-xs"
                onClick={() => frame.current?.requestFullscreen?.().catch(() => undefined)}
              >
                <Maximize2 className="h-3.5 w-3.5" />

                <>{texts.games.game.fullscreen}</>
              </Button>

              <a
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-text-subtle transition hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />

                <>{texts.games.game.openAtOrigin}</>
              </a>
            </div>
          </div>
        </div>

        {gasto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-border-soft bg-surface-card p-5">
              <h3 className="text-base font-semibold">O jogo quer gastar faíscas</h3>

              <p className="mt-2 text-sm text-text-strong">
                <span className="font-semibold">{formatFaisca(gasto.amount)} faíscas</span>
                {gasto.motivo ? ` — ${gasto.motivo}` : ""}
              </p>

              <p className="mt-1 text-xs text-text-subtle">
                O gasto só acontece com a sua confirmação. O jogo nunca acessa a sua conta nem a sua
                sessão — ele apenas pediu.
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" className="rounded-full" onClick={() => setGasto(null)}>
                  Recusar
                </Button>

                <Button
                  className="rounded-full"
                  disabled={confirmarGasto.isPending}
                  onClick={() => confirmarGasto.mutate()}
                >
                  {confirmarGasto.isPending ? "Confirmando…" : "Confirmar gasto"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {compartilhamento && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border-soft bg-surface-card p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Compartilhar conquista
              </h3>

              <p className="mt-2 rounded-xl bg-surface-2 p-3 text-sm text-text-strong">
                {compartilhamento.texto}
              </p>

              {compartilhamento.imagem && (
                <img
                  src={compartilhamento.imagem}
                  alt=""
                  className="mt-2 max-h-48 w-full rounded-xl border border-border-soft object-contain"
                />
              )}

              <p className="mt-2 text-xs text-text-subtle">
                Publica no seu feed com a tag do jogo <span className="font-medium">{g.title}</span>
                . A imagem e o texto vêm do jogo — confira antes de publicar.
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setCompartilhamento(null)}
                >
                  Cancelar
                </Button>

                <Button
                  className="rounded-full"
                  disabled={compartilhar.isPending}
                  onClick={() => compartilhar.mutate({ gameId: g.id, ...compartilhamento })}
                >
                  {compartilhar.isPending ? "Publicando…" : "Publicar no feed"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {gallery.slice(1, 6).map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="h-24 w-40 shrink-0 rounded-xl border border-border-soft object-cover"
              />
            ))}
          </div>
        )}

        <section className="surface-card space-y-3 p-4 sm:p-5">
          <h2 className="text-base font-medium">{texts.games.game.about}</h2>

          <p className="whitespace-pre-line text-sm font-normal text-muted-foreground">
            {g.description}
          </p>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {g.genres.length > 0 && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                  {texts.games.game.genres}
                </dt>

                <dd className="text-text-strong">{g.genres.join(", ")}</dd>
              </div>
            )}

            {g.languages.length > 0 && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                  {texts.games.game.languages}
                </dt>

                <dd className="text-text-strong">{g.languages.join(", ")}</dd>
              </div>
            )}

            {g.controls && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                  {texts.games.game.controls}
                </dt>

                <dd className="text-text-strong">{g.controls}</dd>
              </div>
            )}

            {g.requirements && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                  {texts.games.game.requirements}
                </dt>

                <dd className="text-text-strong">{g.requirements}</dd>
              </div>
            )}

            {g.contentWarnings && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                  {texts.games.game.warnings}
                </dt>

                <dd className="text-text-strong">{g.contentWarnings}</dd>
              </div>
            )}
          </dl>
        </section>

        <GameReviewsSection gameId={g.id} ownerId={g.userId} />
        <GameCommentsSection gameId={g.id} ownerId={g.userId} />

        <section className="surface-card space-y-3 p-4 sm:p-5">
          <h2 className="text-base font-medium">{texts.games.game.updates}</h2>

          {(updates.data?.length ?? 0) === 0 ? (
            <p className="text-sm font-normal text-text-subtle">{texts.games.game.noUpdates}</p>
          ) : (
            <ul className="space-y-3">
              {updates.data!.map((update) => (
                <li key={update.id} className="border-l-2 border-border-soft pl-3">
                  <p className="text-sm font-medium text-text-strong">
                    {update.title}
                    {update.version && (
                      <span className="ml-2 text-xs font-normal text-text-subtle">
                        {texts.games.game.version(update.version)}
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-text-subtle">
                    {new Date(update.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {update.body && (
                    <p className="mt-1 whitespace-pre-line text-sm font-normal text-muted-foreground">
                      {update.body}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {g.owned && editing && (
        <GameEditorDialog
          game={g}
          open={editing}
          onOpenChange={setEditing}
          onDeleted={() => void navigate({ to: "/games" })}
        />
      )}

      {g.owned && newUpdate && (
        <GameUpdateDialog game={g} open={newUpdate} onOpenChange={setNewUpdate} />
      )}
    </AppContainer>
  );
}
