import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { PostActionsProps } from "@/types/components/post/post-actions-props";
import { Bookmark, Flag, Heart, MessageSquare, Repeat2, Share2 } from "lucide-react";

import { REACTION_EMOJIS, feedApi, reactionsApi } from "@/lib/api";
import { usePostReaction } from "@/lib/reactions/use-post-reaction";
import { useAuth } from "@/lib/use-auth";
import { useMountedOnce } from "@/lib/use-mounted-once";

import { useToast } from "@/components/ui/toast";

import { ReactionPicker } from "./reaction-picker";
import { ReactionsDialog } from "./reactions-dialog";
import { ReportDialog } from "./report-dialog";
import { RepostDialog } from "./repost-dialog";
import { SealsDialog } from "./seals-dialog";

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
  const { toast } = useToast();
  const initializePostCard = usePostCardStore((state) => state.initializePostCard);
  const disposePostCard = usePostCardStore((state) => state.disposePostCard);
  const card = usePostCardStore((state) => state.cards[post.id]);
  const setPostCounters = usePostCardStore((state) => state.setPostCounters);
  const setReactionStatus = usePostCardStore((state) => state.setReactionStatus);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);
  const setShowReport = usePostCardStore((state) => state.setShowReport);

  const postCounters = card?.postCounters ?? post.counters;
  const reactionStatus = card?.reactionStatus ?? post.currentUserReaction ?? null;
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
  const { toggle: toggleReaction } = usePostReaction(post.id);
  // Enquanto há reação em andamento, o estado otimista manda — a prop do feed não sobrescreve.
  const reactionPendingRef = useRef(false);
  reactionPendingRef.current = card?.reactionPending ?? false;

  useEffect(() => {
    initializePostCard(post);
    return () => disposePostCard(post.id);
  }, [disposePostCard, initializePostCard, post]);

  useEffect(() => {
    if (reactionPendingRef.current) return;
    setReactionStatus(post.id, post.currentUserReaction ?? null);
  }, [post.currentUserReaction, post.id, setReactionStatus]);

  const [saved, setSaved] = useState(false);

  // Sem sessão não há "salvos" para perguntar — a resposta seria 401 numa página que abre para
  // quem recebeu o link (o post do blog, o post compartilhado).
  const { data: savedData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => feedApi.listSaved(),
    staleTime: 30_000,
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
      setSaved(!saved);
      setPostCounters(post.id, result.counters);
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
      setPostCounters(post.id, result.counters);
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
    <>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <div className="flex items-center">
          {/* Coração primeiro — reação principal, estilo LinkedIn. */}
          <ReactionPicker
            activeType={reactionStatus}
            onReact={toggleReaction}
            buttonClassName={`flex items-center gap-1.5 rounded-lg px-2.5 py-2.5 transition hover:bg-muted hover:text-foreground ${
              reactionStatus ? "text-primary" : ""
            }`}
            buttonTitle={
              reactionStatus
                ? texts.posts.reactions.reactedWith(REACTION_EMOJIS[reactionStatus])
                : texts.posts.reactions.react
            }
          >
            {reactionStatus ? (
              <span className="text-base leading-none">{REACTION_EMOJIS[reactionStatus]}</span>
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </ReactionPicker>

          {reactionCount > 0 && (
            <button
              type="button"
              onClick={() => setShowReactions(post.id, true)}
              title={texts.posts.reactions.seeWho(reactionCount)}
              aria-label={texts.posts.reactions.seeWho(reactionCount)}
              aria-haspopup="dialog"
              className="flex h-9 items-center rounded-lg px-1.5 text-xs tabular-nums text-muted-foreground transition hover:bg-muted hover:text-foreground hover:underline decoration-dotted underline-offset-4"
            >
              {reactionCount}
            </button>
          )}

          <button
            onClick={onComments}
            title={texts.posts.comments.title}
            aria-label={texts.posts.comments.title}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2.5 transition hover:bg-muted hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" />

            <span className="text-xs tabular-nums">{postCounters.comments}</span>
          </button>

          {canRepost && (
            <button
              onClick={() => {
                if (!requireAuth()) return;
                setRepostOpen(true);
              }}
              title={texts.posts.repost}
              aria-label={texts.posts.repost}
              className="flex items-center rounded-lg px-2.5 py-2.5 transition hover:bg-muted hover:text-foreground"
            >
              <Repeat2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={handleShare}
            title={texts.posts.share}
            aria-label={texts.posts.share}
            className="flex items-center rounded-lg px-2.5 py-2.5 transition hover:bg-muted hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </button>

          {children}

          <button
            onClick={() => setShowReport(post.id, true)}
            title={texts.posts.report.title}
            aria-label={texts.posts.report.title}
            className="flex items-center rounded-lg px-2.5 py-2.5 transition hover:bg-muted hover:text-foreground"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleSave}
          title={saved ? texts.posts.unsave : texts.posts.save}
          aria-label={saved ? texts.posts.unsave : texts.posts.save}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2.5 transition hover:bg-muted hover:text-foreground ${
            saved ? "text-primary" : ""
          }`}
        >
          <Bookmark className="h-4 w-4" />

          <span className="text-xs tabular-nums">{postCounters.saves}</span>
        </button>
      </footer>

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
  );
}
