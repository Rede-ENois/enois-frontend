import { useEffect, useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { PostActionsProps } from "@/types/components/post/post-actions-props";
import { PostActions as PostActionsView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { REACTION_EMOJIS, reactionsApi } from "@/lib/api";
import { updatePostInQueryCache } from "@/lib/feed/post-query-cache";
import {
  savedPostsQueryOptions,
  savedStateFromAction,
  syncSavedPostsCache,
} from "@/lib/feed/saved-posts";
import { prefersReducedMotion, readForceMotion, readLiteMode } from "@/lib/lite-mode";
import { usePostReaction } from "@/lib/reactions/use-post-reaction";
import { useAuth } from "@/lib/use-auth";
import { useMountedOnce } from "@/lib/use-mounted-once";

import { ReactionsDialog } from "./reactions-dialog";
import { ReportDialog } from "./report-dialog";
import { RepostDialog } from "./repost-dialog";
import { SealsDialog } from "./seals-dialog";

/** O pulso da reação respeita o modo lite e o "reduzir movimento" do sistema. */
const motionAllowed = () => !readLiteMode() && (readForceMotion() || !prefersReducedMotion());

/**
 * A fileira de ações de um post: reagir, ver quem reagiu, comentar, compartilhar, salvar e
 * denunciar.
 *
 * Era o rodapé do card do feed e virou peça própria porque o post do blog é o MESMO post (o
 * ponteiro do feed tem o id do post do blog) e ficava sem ação nenhuma lá — reagir, comentar e
 * compartilhar só existiam no feed. Aqui as duas telas usam o mesmo estado, guardado no store do
 * card pela chave do post.
 */
export function PostActions({ post, onComments, shareUrl, children }: PostActionsProps) {
  const { requireAuth, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const initializePostCard = usePostCardStore((state) => state.initializePostCard);
  const disposePostCard = usePostCardStore((state) => state.disposePostCard);
  const card = usePostCardStore((state) => state.cards[post.id]);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);
  const setShowReport = usePostCardStore((state) => state.setShowReport);

  const postCounters = post.counters;
  // O reactionSummary (contagem real por tipo) é a verdade; postCounters.reactions pode estar
  // dessincronizado (bug no decrement ou credibilidade que desconta). Soma do summary quando existe.
  const summaryTotal = post.reactionSummary
    ? Object.values(post.reactionSummary).reduce((a, b) => a + b, 0)
    : null;
  const reactionCount = summaryTotal ?? postCounters.reactions;
  const showReport = card?.showReport ?? false;
  // Os diálogos do card só montam quando abertos pela primeira vez: com 20 a 60 cards na tela,
  // montar todos de saída eram quatro diálogos, quatro queries e uma mutation a mais por card.
  const reactionsMounted = useMountedOnce(card?.showReactions ?? false);
  const sealsMounted = useMountedOnce(card?.showSeals ?? false);
  const reportMounted = useMountedOnce(showReport);
  const { toggle: toggleReaction } = usePostReaction(post.id, post);

  useEffect(() => {
    initializePostCard(post.id);
    return () => disposePostCard(post.id);
  }, [disposePostCard, initializePostCard, post]);

  const [saved, setSaved] = useState(false);

  // Sem sessão não há "salvos" para perguntar — a resposta seria 401 numa página que abre para
  // quem recebeu o link (o post do blog, o post compartilhado).
  const { data: savedData } = useQuery({
    ...savedPostsQueryOptions(),
    enabled: !!user,
  });

  useEffect(() => {
    if (savedData) {
      setSaved(savedData.items.some((p) => p.id === post.id));
    }
  }, [savedData, post.id]);

  const handleSave = async () => {
    if (!requireAuth()) return;
    try {
      const result = saved
        ? await reactionsApi.removeSave(post.id)
        : await reactionsApi.save(post.id);
      const nextSaved = savedStateFromAction(result.status);
      if (nextSaved !== null) setSaved(nextSaved);
      updatePostInQueryCache(queryClient, post.id, (current) => ({
        ...current,
        counters: result.counters,
      }));
      syncSavedPostsCache(queryClient, post, result);
    } catch {
      // silently fail
    }
  };

  // Republicar copia o post para o feed da pessoa, creditando o autor original. Conteúdo de
  // comunidade/canal e os tipos que não viajam (página, artigo, blog, business, moment) ficam de fora.
  const canRepost =
    !post.community && !["PAGE", "ARTICLE", "BLOG", "BUSINESS", "MOMENT"].includes(post.type);
  // O clique abre o diálogo, que oferece republicar direto ou com uma opinião (até 600).
  const [repostOpen, setRepostOpen] = useState(false);
  const repostMounted = useMountedOnce(repostOpen);

  const handleShare = async () => {
    if (!requireAuth()) return;
    const url = shareUrl ?? `${window.location.origin}/post/${post.id}`;
    try {
      const result = await reactionsApi.share(post.id);
      updatePostInQueryCache(queryClient, post.id, (current) => ({
        ...current,
        counters: result.counters,
      }));
      // Share nativo so no celular: no desktop o dialog rejeita sem gesto e parecia
      // "nao fazer nada". PC copia o link (com aviso); mobile usa o sheet do sistema.
      if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        try {
          await navigator.share({ url });
          return;
        } catch (nativeFailed) {
          // usuario cancelou ou o navegador recusou: cai para copiar
        }
      }
      await navigator.clipboard.writeText(url);
      toast(texts.posts.shareCopied, "success");
    } catch {
      toast(texts.posts.shareCopied, "error");
    }
  };

  return (
    <PostActionsView
      emojis={REACTION_EMOJIS}
      reactionStatus={post.currentUserReaction ?? null}
      onReact={toggleReaction}
      // Enquanto há reação em andamento, o estado otimista manda — a prop do feed não sobrescreve.
      reactionPending={card?.reactionPending ?? false}
      motionAllowed={motionAllowed}
      reactionCount={reactionCount}
      commentsCount={postCounters.comments}
      savesCount={postCounters.saves}
      saved={saved}
      canRepost={canRepost}
      onShowReactions={() => setShowReactions(post.id, true)}
      onComments={onComments}
      onRepost={() => {
        if (!requireAuth()) return;
        setRepostOpen(true);
      }}
      onShare={handleShare}
      onReport={() => setShowReport(post.id, true)}
      onSave={handleSave}
      dialogs={
        <>
          {repostMounted && (
            <RepostDialog postId={post.id} open={repostOpen} onOpenChange={setRepostOpen} />
          )}
          {reactionsMounted && <ReactionsDialog postId={post.id} />}
          {sealsMounted && <SealsDialog postId={post.id} />}
          {reportMounted && (
            <ReportDialog
              targetId={post.id}
              targetType="POST"
              open={showReport}
              onOpenChange={(next) => setShowReport(post.id, next)}
            />
          )}
        </>
      }
    >
      {children}
    </PostActionsView>
  );
}
