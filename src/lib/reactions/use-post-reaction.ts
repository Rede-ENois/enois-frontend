import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { ReactionsListResponse } from "@/types/application/reaction/reactions-list-response";
import type { UsePostReactionResult } from "@/types/lib/reactions/use-post-reaction-result";
import {
  applyReactionToSummary,
  removeReactionFromSummary,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { ApiError, reactionsApi } from "@/lib/api";
import { isUnseenFeedQuery, updatePostInQueryCache } from "@/lib/feed/post-query-cache";
import { useAuth } from "@/lib/use-auth";

import { reactionsQueryOptions } from "./query-options";

/**
 * Janela curta contra duplo toque. Fica fora do React de propósito: as duas instâncias do hook
 * (a barra do post e as pílulas do resumo) precisam enxergar a mesma janela.
 */
const RAPID_CLICK_WINDOW_MS = 200;
/** Depois disto uma requisição "em voo" deixa de ser esperada: a resposta se perdeu. */
const STALE_IN_FLIGHT_MS = 15_000;
const lastSentAt = new Map<string, number>();
const inFlight = new Set<string>();

/** Última intenção descartada de cada post enquanto uma requisição estava em voo; executada no fim. */
const queued = new Map<string, ReactionType>();

/**
 * Dono da requisição em voo de cada post. O `finally` de uma requisição antiga não pode destravar o
 * card de uma nova: sem isto, a resposta lenta de A zerava o `reactionPending` setado pela intenção
 * B, os botões destravavam no meio do voo de B e um clique extra entrava na fila, somando de novo.
 */
let nextRequestId = 0;
const currentRequest = new Map<string, number>();

/** Só para teste: zera a janela entre casos (o estado do módulo sobrevive a cada um). */
export function resetReactionGuards(): void {
  lastSentAt.clear();
  inFlight.clear();
  queued.clear();
  currentRequest.clear();
  nextRequestId = 0;
}

/**
 * Alterna a reação do post: clicar no tipo atual remove, clicar em outro troca, clicar sem reação
 * adiciona.
 *
 * <p>A ordem importa: o estado otimista é enfeite, a requisição é o que vale. Por isso a
 * atualização do cache roda dentro de um try/catch próprio — se ela falhar (cache parcial, campo
 * ausente), a chamada ao servidor acontece do mesmo jeito. Antes, uma exceção no otimismo abortava
 * a mutação antes do `fetch`, e a pessoa via "não foi possível reagir" sem nenhuma requisição sair
 * do navegador.</p>
 */
export function usePostReaction(postId: string, post: PostView): UsePostReactionResult {
  const queryClient = useQueryClient();
  const { requireAuth, user } = useAuth();
  const { toast } = useToast();
  const setReactionPending = usePostCardStore((state) => state.setReactionPending);
  const [isPending, setIsPending] = useState(false);

  const reactionStatus = post.currentUserReaction ?? null;
  const queryKey = reactionsQueryOptions(postId).queryKey;

  const currentPost = (): PostView => queryClient.getQueryData<PostView>(["post", postId]) ?? post;

  const toggle = async (type: ReactionType) => {
    if (!requireAuth()) return;
    const now = Date.now();
    // Clique durante uma requisição em voo não é descartado: fica como última intenção e roda
    // quando a atual terminar — descartar fazia a pessoa clicar várias vezes para desreagir e a
    // tela não mudar (#1053). Só a última conta: alternar duas vezes durante o voo é um clique
    // apressado, não dois gestos.
    if (inFlight.has(postId)) {
      // Card fora de órbita não deve segurar clique: sem requisição chegando, o `inFlight` que
      // sobrou de uma resposta perdida só travava o botão. Passado o teto, a fila é descartada e
      // o clique entra como requisição nova.
      const started = lastSentAt.get(postId);
      if (started !== undefined && now - started < STALE_IN_FLIGHT_MS) {
        queued.set(postId, type);
        return;
      }
      queued.delete(postId);
      inFlight.delete(postId);
      currentRequest.delete(postId);
      if (usePostCardStore.getState().cards[postId]) setReactionPending(postId, false);
    }
    const previous = lastSentAt.get(postId);
    // Relógio para trás (troca de fuso, teste, aba suspensa) não pode travar o botão.
    if (previous !== undefined && now >= previous && now - previous < RAPID_CLICK_WINDOW_MS) return;
    if (lastSentAt.size > 500) lastSentAt.clear();
    const requestId = ++nextRequestId;
    currentRequest.set(postId, requestId);
    inFlight.add(postId);
    lastSentAt.set(postId, now);
    setIsPending(true);
    setReactionPending(postId, true);

    const before = currentPost();
    const mine = before.currentUserReaction ?? null;
    const remove = mine !== null && mine === type;
    const previousSummary = queryClient.getQueryData<ReactionsListResponse>(queryKey);

    // Otimismo é melhor esforço: qualquer falha aqui é descartada sem impedir a requisição.
    try {
      updatePostInQueryCache(queryClient, postId, (current) => {
        // O resumo só é otimista se o SERVIDOR mandou um. O feed do post não traz
        // `reactionSummary` (o backend só o calcula para comentário): partir de `{}` criava um
        // resumo do nada, que a tela passava a somar no lugar de `counters.reactions` e que
        // crescia a cada clique sem o backend contar — o número e a pílula subindo juntos.
        const baseSummary = current.reactionSummary;
        const withoutMine =
          baseSummary != null && mine && mine !== type
            ? removeReactionFromSummary(baseSummary, mine)
            : baseSummary;
        return {
          ...current,
          currentUserReaction: remove ? null : type,
          counters: {
            ...current.counters,
            reactions: Math.max(
              0,
              (current.counters?.reactions ?? 0) + (remove ? -1 : mine && mine !== type ? 0 : 1),
            ),
          },
          reactionSummary:
            baseSummary == null
              ? current.reactionSummary
              : remove
                ? removeReactionFromSummary(baseSummary, mine ?? type)
                : applyReactionToSummary(withoutMine!, type),
        };
      });
      queryClient.setQueryData<ReactionsListResponse>(queryKey, (current) => {
        const base = current ?? {
          summary: post.reactionSummary ?? {},
          reactions: [],
          partial: true,
        };
        const myId = user?.id;
        const others = myId ? base.reactions.filter((r) => r.userId !== myId) : base.reactions;
        const withoutMine =
          mine && mine !== type ? removeReactionFromSummary(base.summary, mine) : base.summary;
        return {
          ...base,
          summary:
            before.reactionSummary == null
              ? base.summary
              : remove
                ? removeReactionFromSummary(base.summary, mine ?? type)
                : applyReactionToSummary(withoutMine, type),
          reactions:
            myId && !remove
              ? [{ userId: myId, type, createdAt: new Date().toISOString() }, ...others]
              : others,
        };
      });
    } catch {
      // Cache em formato inesperado não pode derrubar a ação.
    }

    try {
      const result = remove
        ? await reactionsApi.removeReaction(postId)
        : await reactionsApi.react(postId, type);
      if (result && "counters" in result && result.counters) {
        try {
          updatePostInQueryCache(queryClient, postId, (current) => ({
            ...current,
            counters: result.counters ?? current.counters,
          }));
        } catch {
          // Idem: a resposta do servidor já é a verdade; o cache se corrige no refetch.
        }
      }
    } catch (error) {
      // Desfaz o que foi pintado e explica o que de fato aconteceu.
      try {
        if (previousSummary !== undefined) {
          queryClient.setQueryData(queryKey, previousSummary);
        } else {
          queryClient.removeQueries({ queryKey });
        }
        updatePostInQueryCache(queryClient, postId, (current) => ({
          ...current,
          currentUserReaction: before.currentUserReaction ?? null,
          counters: before.counters ?? current.counters,
          // O resumo também é otimista: sem restaurá-lo, a bolinha e o contador da reação que
          // falhou ficavam pintados (ou sumiam, quando a soma zerava) até a revalidação chegar.
          reactionSummary: before.reactionSummary ?? current.reactionSummary,
        }));
      } catch {
        // Sem cache para restaurar: o refetch abaixo alinha com o servidor.
      }
      toast(messageFor(error), "error");
    } finally {
      // Só quem ainda é dono da trava destrava (a requisição da intenção enfileirada é a dona
      // nova). A revalidação vem depois e não segura a trava.
      if (currentRequest.get(postId) === requestId) {
        currentRequest.delete(postId);
        inFlight.delete(postId);
        setIsPending(false);
        setReactionPending(postId, false);
      }
      void queryClient.invalidateQueries({ queryKey });
      // A aba "Ainda não vi" fica de fora: revalidá-la tiraria da tela o post em que a pessoa
      // acabou de reagir (issue #559). O contador já foi atualizado no cache acima.
      void queryClient.invalidateQueries({
        queryKey: ["feed"],
        predicate: (query) => !isUnseenFeedQuery(query.queryKey),
      });
      void queryClient.invalidateQueries({ queryKey: ["post", postId] });
      // A intenção registrada durante o voo roda com o cache já revalidado; a janela de 200ms
      // continua valendo (Date.now real), então toque acidental duplo continua filtrado.
      const nextType = queued.get(postId);
      if (nextType !== undefined) {
        queued.delete(postId);
        void toggle(nextType);
      }
    }
  };

  return { toggle: (type) => void toggle(type), isPending, reactionStatus };
}

/** Uma frase por motivo real: recusa de permissão, limite, sessão, rede ou falha desconhecida. */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return texts.posts.reactions.restrictedError;
    if (error.status === 429) return texts.posts.reactions.rateLimitError;
    if (error.status === 401) return texts.posts.reactions.sessionError;
    if (error.status === 0) return texts.posts.reactions.networkError;
  }
  return texts.posts.reactions.error;
}
