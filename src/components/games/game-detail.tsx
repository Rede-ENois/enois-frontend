import { useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { GameIdentityBinding } from "@/types/application/games/game-identity-binding";
import type { GamePendingRequest } from "@/types/application/games/game-pending-request";
import type { GameShareRequest } from "@/types/application/games/game-share-request";
import type { GameSpendRequest } from "@/types/application/games/game-spend-request";
import type { GameView } from "@/types/application/games/game-view";
import {
  GameDetail as GameDetailView,
  GamePlayer,
  GameStatsLine,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { gamesApi, mediaApi } from "@/lib/api";
import { formatarData } from "@/lib/date/format";
import { formatFaisca } from "@/lib/faisca";
import { walletQueries } from "@/lib/query-options/wallet";
import { getSessionKey, useSessionKey } from "@/lib/session-key";
import { isAuthenticated, useAuth } from "@/lib/use-auth";

import { GameCommentsSection } from "@/components/games/game-comments-section";
import { GameEditorDialog } from "@/components/games/game-editor-dialog";
import { GameReviewsSection } from "@/components/games/game-reviews-section";
import { GameUpdateDialog } from "@/components/games/game-update-dialog";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * O jogo só PEDE identidade, gasto e compartilhamento; gasto e publicação acontecem com o clique da
 * pessoa. O roteador reaproveita o componente quando só os parâmetros mudam, e a chave garante que
 * nada do jogo anterior (pedido aberto, identidade, sessão do quadro) sobreviva à troca de jogo.
 */
export function GameDetail({ username, gameSlug }: { username: string; gameSlug: string }) {
  return (
    <GameDetailContent key={`${username}/${gameSlug}`} username={username} gameSlug={gameSlug} />
  );
}

function GameDetailContent({ username, gameSlug }: { username: string; gameSlug: string }) {
  const { requireAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessao, setSessao] = useState(0);
  const sessaoAtual = useRef(0);
  const conta = useSessionKey();
  const [contaDoQuadro, setContaDoQuadro] = useState<string | null>(null);
  const [ultimoJogo, setUltimoJogo] = useState<GameView | null>(null);
  const [identidade, setIdentidade] = useState<GameIdentityBinding | null>(null);
  const [compartilhamento, setCompartilhamento] =
    useState<GamePendingRequest<GameShareRequest> | null>(null);
  const [gasto, setGasto] = useState<GamePendingRequest<GameSpendRequest> | null>(null);
  const [editing, setEditing] = useState(false);
  const [newUpdate, setNewUpdate] = useState(false);
  const navigate = useNavigate();
  const t = texts.games.game;
  const slugKey = ["games", "slug", username, gameSlug];

  const game = useQuery({
    queryKey: slugKey,
    queryFn: () => gamesApi.bySlug(username, gameSlug),
    staleTime: 0,
  });
  const gameId = game.data?.id;

  const stats = useQuery({
    queryKey: ["games", "stats", gameId],
    queryFn: () => gamesApi.stats(gameId!),
    enabled: Boolean(gameId),
  });

  const updates = useQuery({
    queryKey: ["games", "updates", gameId],
    queryFn: () => gamesApi.updates(gameId!),
    enabled: Boolean(gameId),
  });

  const play = useMutation({
    mutationFn: (id: string) => gamesApi.play(id),
    onSuccess: (_resposta, id) =>
      queryClient.invalidateQueries({ queryKey: ["games", "stats", id] }),
  });

  const emitirIdentidade = useMutation({
    mutationFn: (id: string) => gamesApi.identity(id),
  });

  const confirmarGasto = useMutation({
    mutationFn: (pedido: GamePendingRequest<GameSpendRequest>) =>
      gamesApi.spend(pedido.gameId, pedido.amount, pedido.motivo, pedido.requestId),
    onSuccess: (_resposta, pedido) => {
      setGasto((atual) => (atual?.requestId === pedido.requestId ? null : atual));
      toast(t.spend.done, "success");
      void queryClient.invalidateQueries({ queryKey: walletQueries.wallet().queryKey });
    },
    onError: () => toast(t.spend.error, "error"),
  });

  const favorite = useMutation({
    mutationFn: (vars: { gameId: string; favorited: boolean }) =>
      vars.favorited ? gamesApi.unfavorite(vars.gameId) : gamesApi.favorite(vars.gameId),
    onSuccess: (resposta, vars) => {
      queryClient.setQueryData<GameView>(slugKey, (atual) =>
        atual?.id === vars.gameId
          ? { ...atual, favorited: resposta.favorited, favorites: resposta.favorites }
          : atual,
      );
      void queryClient.invalidateQueries({ queryKey: slugKey });
      void queryClient.invalidateQueries({ queryKey: ["games", "stats", vars.gameId] });
    },
    onError: () => toast(t.favoriteError, "error"),
  });

  const compartilhar = useMutation({
    mutationFn: async (pedido: GamePendingRequest<GameShareRequest>) => {
      let mediaIds: string[] = [];
      if (pedido.imagem) {
        const blob = await (await fetch(pedido.imagem)).blob();
        const arquivo = new File([blob], "conquista.png", { type: blob.type || "image/png" });
        const resultado = await mediaApi.requestUpload({
          fileName: `media/${crypto.randomUUID()}/conquista.png`,
          mimeType: arquivo.type,
          size: arquivo.size,
          purpose: "POST_IMAGE",
        });
        if (resultado.provider !== "S3") {
          throw new Error(t.achievement.uploadsDisabled);
        }
        await mediaApi.uploadToSignedUrl(
          resultado.uploadUrl,
          arquivo,
          resultado.uploadHeaders ?? {},
        );
        mediaIds = [resultado.id];
      }
      return gamesApi.compartilhar(pedido.gameId, pedido.texto, mediaIds);
    },
    onSuccess: (_resposta, pedido) => {
      setCompartilhamento((atual) => (atual === pedido ? null : atual));
      toast(t.achievement.done, "success");
    },
    onError: () => toast(t.achievement.error, "error"),
  });

  // Trocar de sessão zera a cache e a resposta some até chegar a nova. O quadro não pode cair por
  // isso: o player segue com os dados públicos do último jogo exibido, e o que depende de quem lê
  // (favorito) só sai da resposta nova.
  if (game.data && game.data !== ultimoJogo) setUltimoJogo(game.data);
  const jogo = game.data ?? ultimoJogo;

  const g = jogo;
  const favorited = game.data?.favorited ?? false;
  const owned = game.data?.owned ?? false;
  const playable = g ? g.status === "PUBLISHED" : false;
  // O quadro pertence à conta que apertou Jogar. Pedido de outro jogo, de outra sessão do quadro ou
  // de um quadro aberto por outra conta não aparece nem pode ser confirmado.
  const contaTrocou = sessao > 0 && contaDoQuadro !== conta;
  const doQuadroAtual = <T extends { gameId: string; session: number }>(pedido: T | null) =>
    g && pedido && pedido.gameId === g.id && pedido.session === sessao && !contaTrocou
      ? pedido
      : null;
  const gastoAtivo = doQuadroAtual(gasto);
  const compartilhamentoAtivo = doQuadroAtual(compartilhamento);
  const identidadeAtiva = doQuadroAtual(identidade);

  return (
    <GameDetailView
      notFound={game.isError}
      game={g}
      username={username}
      gamesHref="/games"
      developerHref={`/games/${username}`}
      owned={owned}
      favorited={favorited}
      favoriteDisabled={favorite.isPending || !game.data}
      onToggleFavorite={() => {
        if (!g || !requireAuth()) return;
        favorite.mutate({ gameId: g.id, favorited });
      }}
      onShare={async () => {
        if (!g) return;
        const url = `${window.location.origin}/games/${g.username ?? username}/${g.slug}`;
        try {
          await navigator.clipboard.writeText(url);
          toast(t.shareCopied, "success");
        } catch {
          toast(t.shareCopied, "error");
        }
      }}
      onEdit={() => setEditing(true)}
      onNewUpdate={() => setNewUpdate(true)}
      renderBannerFrame={(props) => <SandboxedHtmlFrame {...props} />}
      accountChanged={contaTrocou}
      player={
        g && (
          <GamePlayer
            key={g.id}
            url={g.url}
            title={g.title}
            aspect={g.aspect}
            playable={playable}
            tallOnMobile
            identity={
              identidadeAtiva
                ? { session: identidadeAtiva.session, token: identidadeAtiva.token }
                : null
            }
            stats={
              <GameStatsLine
                plays={stats.data?.plays ?? g.plays}
                players={stats.data?.players ?? null}
                favorites={stats.data?.favorites ?? g.favorites}
              />
            }
            onStart={(retry, session) => {
              // "Tentar de novo" recarrega o mesmo jogo: não é partida nova para a métrica, mas o
              // token de identidade é de uso único e o jogo recarregado vai pedir outro.
              const gameIdDaSessao = g.id;
              const contaDaSessao = getSessionKey();
              sessaoAtual.current = session;
              setSessao(session);
              setContaDoQuadro(contaDaSessao);
              setIdentidade(null);
              setGasto(null);
              setCompartilhamento(null);
              if (!retry) play.mutate(gameIdDaSessao);
              if (isAuthenticated()) {
                emitirIdentidade.mutate(gameIdDaSessao, {
                  onSuccess: ({ token }) => {
                    if (sessaoAtual.current !== session || getSessionKey() !== contaDaSessao) {
                      return;
                    }
                    setIdentidade({ gameId: gameIdDaSessao, session, token });
                  },
                });
              }
            }}
            onShareRequest={(pedido, session) =>
              setCompartilhamento((atual) =>
                atual?.gameId === g.id && atual.session === session
                  ? atual
                  : { ...pedido, gameId: g.id, session },
              )
            }
            onSpendRequest={(pedido, session) =>
              setGasto((atual) =>
                atual?.gameId === g.id && atual.session === session
                  ? atual
                  : { ...pedido, gameId: g.id, session },
              )
            }
          />
        )
      }
      spend={
        gastoAtivo
          ? { amountLabel: formatFaisca(gastoAtivo.amount), motivo: gastoAtivo.motivo }
          : null
      }
      spendPending={confirmarGasto.isPending}
      onSpendDismiss={() => setGasto(null)}
      onSpendConfirm={() => {
        if (g && gastoAtivo?.gameId === g.id) confirmarGasto.mutate(gastoAtivo);
      }}
      achievement={compartilhamentoAtivo}
      achievementPending={compartilhar.isPending}
      onAchievementDismiss={() => setCompartilhamento(null)}
      onAchievementPublish={() => {
        if (g && compartilhamentoAtivo?.gameId === g.id) {
          compartilhar.mutate(compartilhamentoAtivo);
        }
      }}
      reviews={g && <GameReviewsSection gameId={g.id} ownerId={g.userId} />}
      comments={g && <GameCommentsSection gameId={g.id} ownerId={g.userId} />}
      updates={(updates.data ?? []).map((update) => ({
        id: update.id,
        title: update.title,
        body: update.body,
        version: update.version,
        dateLabel: formatarData(update.createdAt, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      }))}
      dialogs={
        <>
          {owned && editing && game.data && (
            <GameEditorDialog
              game={game.data}
              open={editing}
              onOpenChange={setEditing}
              onDeleted={() => void navigate({ to: "/games" })}
            />
          )}

          {owned && newUpdate && game.data && (
            <GameUpdateDialog game={game.data} open={newUpdate} onOpenChange={setNewUpdate} />
          )}
        </>
      }
    />
  );
}
