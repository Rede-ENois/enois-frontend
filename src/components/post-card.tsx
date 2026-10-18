import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { postContentLimit } from "@/constants/post-content-limits";
import { PAGE_HTML_MAX_LENGTH } from "@/constants/post-page";
import { POST_SEALS, postSeal } from "@/constants/post-seals";
import { usePostCardStore } from "@/stores/post-card.store";
import { postContentLimit } from "@/constants/post-content-limits";
import { texts } from "@/texts";
import type { PostCardProps } from "@/types/components/post/post-card-props";
import { BookOpen, FileText, MoreHorizontal, Pencil, Tag, Trash2 } from "lucide-react";

import { communitiesApi, feedApi } from "@/lib/api";
import { sealsApi } from "@/lib/api/seals";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { MentionTextarea } from "@/components/mention-textarea";

import { AuthorInfo } from "./post/author-info";
import { formatTime } from "./post/format-time";
import { LinkPreviews } from "./post/link-previews";
import { MediaGrid } from "./post/media-grid";
import { PostActions } from "./post/post-actions";
import { PostComments } from "./post/post-comments";
import { PostPage } from "./post/post-page";
import { ReactionsSummary } from "./post/reactions-summary";
import { RichText } from "./post/rich-text";
import { typeMeta } from "./post/type-meta";

/**
 * Posts acima disso entram compactados na LISTA: o corte é por linhas (8) e o "Ler mais" abre o
 * post inteiro. Na página do post o card é o post (`fullPost`), então não corta nem mostra o link —
 * era o furo: o "Ler mais" levava para a página em que a pessoa já estava e o texto seguia cortado.
 */
const POST_COMPACT_THRESHOLD = 400;

export function PostCard({ post, fullPost = false }: PostCardProps) {
  const { requireAuth, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOwner = user?.id != null && user.id === post.authorId;
  const meta = typeMeta[post.type] ?? typeMeta.INSIGHT;
  // Só corta em lista: na página do post o texto inteiro é o conteúdo da página.
  const isCompact = !fullPost && post.content.length > POST_COMPACT_THRESHOLD;
  const [showComments, setShowComments] = useState(false);
  // Selos do post: vem em lote do backend (aqui e um post so; a listagem pode pedir varios de uma vez).
  const { data: seals } = useQuery({
    queryKey: ["seals", post.id],
    queryFn: () =>
      sealsApi.forPosts([post.id]).then((all) => all[post.id] ?? { seals: [], mySeals: [] }),
    staleTime: 60_000,
  });
  // Cada selo alterna sozinho: o backend tira quando já existe, então não há "troca" nem remoção
  // dos outros (a pessoa pode ter quantos quiser neste post).
  const toggleSeal = useMutation({
    mutationFn: (seal: string) => sealsApi.toggle(post.id, seal),
    onSuccess: (result) => {
      queryClient.setQueryData(["seals", post.id], result);
      queryClient.invalidateQueries({ queryKey: ["seals", post.id] });
      queryClient.invalidateQueries({ queryKey: ["seals-people", post.id] });
    },
    onError: () => toast(texts.posts.seals.error, "error"),
  });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [pageDraft, setPageDraft] = useState(post.pageHtml ?? "");

  // A listagem (e a resposta da publicação) não carrega o corpo da página: ele pode ter dezenas de
  // milhares de caracteres e não teria por que viajar no feed inteiro. Quem tem uma página pede o
  // post único — a mesma chave de cache da página do post, então lá já vem pronto.
  const needsPage = post.type === "PAGE" && !post.pageHtml;
  const { data: pagePost, isLoading: pageLoading } = useQuery({
    queryKey: ["post", post.id],
    queryFn: () => feedApi.get(post.id),
    enabled: needsPage,
  });
  const pageHtml = post.pageHtml ?? pagePost?.pageHtml ?? "";
  // As ações do post (reagir, comentar, compartilhar, salvar, denunciar) moram no `PostActions` —
  // a mesma peça que o post do blog usa. Aqui fica só o card, que é quem inicializa o estado dele.
  const initializePostCard = usePostCardStore((state) => state.initializePostCard);
  const disposePostCard = usePostCardStore((state) => state.disposePostCard);
  const setShowSeals = usePostCardStore((state) => state.setShowSeals);
  // `mySeals` é a lista (backend novo); `mySeal` é o campo antigo, para a janela em que o pod do
  // backend ainda não subiu — sem isso, um selo já dado apareceria apagado.
  const mySeals = seals ? (seals.mySeals ?? (seals.mySeal ? [seals.mySeal] : [])) : [];

  useEffect(() => {
    initializePostCard(post);
    return () => disposePostCard(post.id);
  }, [disposePostCard, initializePostCard, post]);

  // A página chega depois do card (requisição própria): preenche o rascunho da edição quando ela
  // aparece, sem atropelar o que o autor já está digitando no diálogo aberto.
  useEffect(() => {
    if (!editOpen) setPageDraft(pageHtml);
  }, [editOpen, pageHtml]);

  // Post proprio: editar o texto e excluir. O backend confere o dono; a UI so evita mostrar para os outros.
  const editPost = useMutation({
    mutationFn: () =>
      feedApi.update(post.id, {
        content: draft.trim(),
        tags: post.tags,
        // Numa pagina o HTML vai junto (o backend recusa edicao de PAGE sem ele); nos outros
        // tipos o campo nem e enviado.
        ...(post.type === "PAGE" ? { pageHtml: pageDraft } : {}),
      }),
    onSuccess: () => {
      setEditOpen(false);
      toast(texts.posts.owner.edited);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
    onError: () => toast(texts.posts.owner.error, "error"),
  });

  const deletePost = useMutation({
    mutationFn: () => feedApi.delete(post.id),
    onSuccess: () => {
      setDeleteOpen(false);
      // Exclusão é lógica: dá para desfazer de verdade, então o aviso traz a ação.
      toast(texts.posts.owner.deleted, "success", {
        label: texts.posts.owner.undo,
        onClick: () => {
          feedApi
            .restore(post.id)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ["feed"] });
              queryClient.invalidateQueries({ queryKey: ["post", post.id] });
              toast(texts.posts.owner.edited);
            })
            .catch(() => toast(texts.posts.owner.error, "error"));
        },
      });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      // Na pagina do post unico, o conteudo some: volta para o feed em vez de ficar num "nao encontrado".
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/post/")) {
        window.location.href = "/feed";
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    },
    onError: () => toast(texts.posts.owner.error, "error"),
  });

  const handleSaveEdit = () => {
    const contentUnchanged = draft.trim() === post.content;
    const pageUnchanged = post.type !== "PAGE" || pageDraft === (post.pageHtml ?? "");

    if (!draft.trim() || (contentUnchanged && pageUnchanged)) {
      setEditOpen(false);
      return;
    }
    editPost.mutate();
  };

  // Seguir a comunidade direto do post: atualiza a lista para esconder o botao e marcar como membro.
  const followCommunity = useMutation({
    mutationFn: (communityId: string) => communitiesApi.join(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      queryClient.invalidateQueries({ queryKey: ["community"] });
    },
  });

  const handleFollowCommunity = () => {
    if (!requireAuth()) return;
    if (!post.community) return;
    followCommunity.mutate(post.community.id);
  };

  // Os comentarios sao carregados pelo proprio PostComments quando a secao abre.
  const toggleComments = () => setShowComments((value) => !value);

  return (
    <article
      className={`min-w-0 border border-border-soft bg-surface-card p-4 transition sm:p-5 ${
        // Post de página: sem canto no card, porque o conteúdo tem de alcançar as bordas — o
        // arredondamento do card recortava os cantos da página e era o que sobrava de "rounding".
        post.pageHtml ? "rounded-none" : "overflow-hidden rounded-2xl"
      }`}
    >
      <header className="flex justify-between items-start gap-3">
        <AuthorInfo
          authorUsername={post.authorUsername}
          authorName={post.authorName}
          authorBadge={post.authorBadge}
          authorAvatar={post.authorAvatar}
          createdAt={post.createdAt}
          community={post.community}
          fallbackClassName={meta.classAvatar}
          onFollowCommunity={handleFollowCommunity}
          followPending={followCommunity.isPending}
        />

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
          >
            {meta.label}
          </span>

          {isOwner && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title={texts.posts.owner.actions}
                  aria-label={texts.posts.owner.actions}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-40 rounded-2xl border-border p-1.5">
                <button
                  onClick={() => {
                    setDraft(post.content);
                    setPageDraft(pageHtml);
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                  {texts.posts.owner.edit}
                </button>

                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive transition hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  {texts.posts.owner.delete}
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </header>

      {/* Selos da comunidade: ficam no topo, acima do conteudo — e os que a pessoa marcou ficam em
          destaque (anel). Cada selo é um botão: abre a lista de quem marcou, como a contagem de
          reações abre a de quem reagiu. A contagem aparece sempre (é a resposta de "quantos"). */}
      {seals && seals.seals.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {seals.seals.map((item) => {
            const seal = postSeal(item.seal);
            if (!seal) return null;
            return (
              <button
                key={item.seal}
                type="button"
                onClick={() => setShowSeals(post.id, true)}
                title={`${seal.label} · ${texts.posts.seals.seeWho}`}
                aria-label={`${seal.label} · ${texts.posts.seals.seeWho}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition hover:border-primary/50",
                  seal.className,
                  mySeals.includes(item.seal) && "ring-1 ring-primary/60",
                )}
              >
                <seal.icon className="h-3 w-3" aria-hidden />

                <>{seal.label}</>

                <span className="tabular-nums opacity-70">{item.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Post de pagina pode nao ter texto nenhum: sem paragrafo, so a pagina logo abaixo.
          Na lista, texto acima de 400 caracteres entra cortado em 8 linhas com o "Ler mais" que
          abre o post; na propria pagina do post (`fullPost`) nada e cortado — o texto completo mora
          la. Artigo fica so cortado na lista: o bloco abaixo dele ja e o convite para abrir. */}
      {post.content.trim() !== "" && (
        <>
          <RichText
            content={post.content}
            className={cn(
              "mt-4 whitespace-pre-line break-words text-base font-normal leading-relaxed text-text-strong",
              isCompact && "line-clamp-8",
            )}
          />

          {isCompact && post.type !== "ARTICLE" && (
            <Link
              to="/post/$postId"
              params={{ postId: post.id }}
              className="mt-1 inline-flex text-sm font-normal text-primary hover:underline"
            >
              <>{texts.common.readMore}</>
            </Link>
          )}
        </>
      )}

      {/* Blog: o post-ponteiro so aponta para o cantinho — o conteudo mora la, nao no feed. */}
      {post.type === "BLOG" && (
        <Link
          to="/blog/$username/$postId"
          params={{ username: post.authorUsername, postId: post.id }}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden />

          <>{texts.blog.feed.read}</>
        </Link>
      )}

      {/* Artigo tem corpo (completo) na pagina do post; o card mostra o resumo e o convite. */}
      {post.type === "ARTICLE" && (
        <Link
          to="/post/$postId"
          params={{ postId: post.id }}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline"
        >
          <FileText className="h-3.5 w-3.5" />

          <>{texts.feed.composer.article.read}</>
        </Link>
      )}

      {post.editedAt && (
        <p className="mt-1 text-xs font-normal text-text-subtle">
          {texts.posts.edited} {texts.posts.authorTime(formatTime(post.editedAt))}
        </p>
      )}

      {post.mediaIds.length > 0 && (
        <div className="mt-4">
          <MediaGrid mediaIds={post.mediaIds} />
        </div>
      )}

      {pageHtml ? (
        <PostPage postId={post.id} html={pageHtml} />
      ) : pageLoading ? (
        <p className="mt-4 rounded-xl border border-dashed border-border-soft px-3 py-6 text-center text-xs font-normal text-text-subtle">
          {texts.posts.page.loading}
        </p>
      ) : null}

      <ReactionsSummary postId={post.id} />
      <LinkPreviews content={post.content} autoplay />

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="rounded-full border border-border-soft bg-transparent font-normal text-text-subtle"
            >
              {texts.posts.tag(t)}
            </Badge>
          ))}
        </div>
      )}

      {/* Selos: entram na fileira das ações (a peça é do card, que é quem sabe os selos do post). */}
      <PostActions post={post} onComments={toggleComments}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2.5 transition hover:bg-muted hover:text-foreground text-muted-foreground"
              title={texts.posts.seals.action}
              aria-label={texts.posts.seals.action}
            >
              <Tag className="h-4 w-4" />
            </button>
          </PopoverTrigger>

          <PopoverContent align="start" className="w-64 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle">
              {texts.posts.seals.title}
            </p>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {POST_SEALS.map((seal) => {
                const mine = mySeals.includes(seal.id);
                return (
                  <button
                    key={seal.id}
                    type="button"
                    onClick={() => toggleSeal.mutate(seal.id)}
                    disabled={toggleSeal.isPending}
                    title={seal.label}
                    aria-label={seal.label}
                    aria-pressed={mine}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium transition hover:border-primary/50",
                      mine
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border-soft text-text-subtle",
                    )}
                  >
                    <seal.icon className="h-4 w-4" aria-hidden />

                    <span className="text-center leading-tight">{seal.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-[11px] leading-snug text-text-subtle">
              {texts.posts.seals.hint}
            </p>

            {mySeals.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  sealsApi.remove(post.id).then((result) => {
                    queryClient.setQueryData(["seals", post.id], result);
                    queryClient.invalidateQueries({ queryKey: ["seals-people", post.id] });
                  })
                }
                className="mt-2 w-full rounded-lg px-2 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
              >
                {texts.posts.seals.remove}
              </button>
            )}
          </PopoverContent>
        </Popover>
      </PostActions>

      {isOwner && (
        <>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{texts.posts.owner.editTitle}</DialogTitle>
              </DialogHeader>

              <MentionTextarea
                value={draft}
                maxLength={postContentLimit(post.type)}
                toolbar
                onChange={(value) => setDraft(value)}
                placeholder={texts.posts.owner.editDescription}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />

              {post.type === "PAGE" && (
                <div>
                  <label
                    htmlFor={`page-html-${post.id}`}
                    className="mb-1 block text-xs font-normal text-text-subtle"
                  >
                    {texts.feed.composer.pageLabel}
                  </label>

                  <Textarea
                    id={`page-html-${post.id}`}
                    value={pageDraft}
                    maxLength={PAGE_HTML_MAX_LENGTH}
                    onChange={(event) => setPageDraft(event.target.value)}
                    placeholder={
                      pageLoading ? texts.posts.page.loading : texts.feed.composer.pagePlaceholder
                    }
                    className="min-h-[160px] font-mono text-xs"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setEditOpen(false)}
                >
                  {texts.common.cancel}
                </Button>

                <Button
                  className="rounded-full"
                  disabled={
                    editPost.isPending ||
                    !draft.trim() ||
                    (post.type === "PAGE" && !pageDraft.trim())
                  }
                  onClick={handleSaveEdit}
                >
                  {editPost.isPending ? texts.common.saving : texts.posts.owner.save}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={texts.posts.owner.deleteTitle}
            description={texts.posts.owner.deleteDescription}
            confirmLabel={texts.posts.owner.confirmDelete}
            destructive
            pending={deletePost.isPending}
            onConfirm={() => deletePost.mutate()}
          />
        </>
      )}

      {showComments && <PostComments postId={post.id} />}
    </article>
  );
}
