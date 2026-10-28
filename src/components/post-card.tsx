import { memo, useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { TOPIC_LABELS } from "@/constants/community-topics";
import { CONTENT_ORIGIN, HAS_CONTENT_ORIGIN } from "@/constants/content-origin";
import { postContentLimit } from "@/constants/post-content-limits";
import { PAGE_EMBED_HEIGHT, PAGE_HTML_MAX_LENGTH } from "@/constants/post-page";
import { ARTICLE_BODY_MAX_LENGTH, POST_TYPES } from "@/constants/post-types";
import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import type { PostCardProps } from "@/types/components/post/post-card-props";
import {
  PostCard as PostCardView,
  PostEditDialog,
  PostPage,
  PostSealPicker,
  type PostTypeOption,
} from "@rede-enois/design-system/domain";
import { ConfirmDialog, useToast } from "@rede-enois/design-system/ui";

import { communitiesApi, feedApi } from "@/lib/api";
import { sealsApi } from "@/lib/api/seals";
import { saveFeedScroll } from "@/lib/feed-scroll-restoration";
import { savedPostsQueryOptions } from "@/lib/feed/saved-posts";
import { useAuth } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { MentionTextarea } from "@/components/mention-textarea";
import { ProfilePeek } from "@/components/profile/profile-peek";

import { formatTime } from "./post/format-time";
import { MediaGrid } from "./post/media-grid";
import { PostActions } from "./post/post-actions";
import { PostComments } from "./post/post-comments";
import { PostNotes } from "./post/post-notes";
import { ReactionsSummary } from "./post/reactions-summary";
import { RichText } from "./post/rich-text";
import { SandboxedHtmlFrame } from "./post/sandboxed-html-frame";

const TYPE_OPTIONS = POST_TYPES as PostTypeOption[];

function PostCardContainer({
  post,
  feedTab,
  fullPost = false,
  pinned = false,
  onTogglePin,
  pinPending = false,
}: PostCardProps) {
  const { requireAuth, user } = useAuth();
  // Modo lite: nada de player de terceiro montando sozinho no feed.
  const lite = useLiteMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOwner = user?.id != null && user.id === post.authorId;
  const [showComments, setShowComments] = useState(fullPost);
  // Selos do post: `forPost` junta os cards da página numa chamada só ao lote do backend.
  const { data: seals } = useQuery({
    queryKey: ["seals", post.id],
    queryFn: () => sealsApi.forPost(post.id),
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
  // A CATEGORIA tambem e editavel (pedido via suporte): o dialogo troca o tipo e as regras de
  // conteudo o acompanham (PAGE pede HTML, ARTICLE pede o corpo).
  const [editType, setEditType] = useState<PostView["type"]>(post.type);
  const [draft, setDraft] = useState(post.content);
  const [pageDraft, setPageDraft] = useState(post.pageHtml ?? "");
  const [bodyDraft, setBodyDraft] = useState(post.articleBody ?? "");

  // A listagem (e a resposta da publicação) não carrega o corpo da página: ele pode ter dezenas de
  // milhares de caracteres e não teria por que viajar no feed inteiro. Quem tem uma página pede o
  // post único — a mesma chave de cache da página do post, então lá já vem pronto.
  const needsPage = post.type === "PAGE" && !post.pageHtml;
  // O corpo do artigo tem o mesmo problema: só a leitura do post único o traz, e a edição precisa
  // dele (o backend exige o corpo em ARTICLE) — na lista ele não viaja.
  const needsArticleBody = post.type === "ARTICLE" && !post.articleBody;
  const { data: pagePost, isLoading: pageLoading } = useQuery({
    queryKey: ["post", post.id],
    queryFn: () => feedApi.get(post.id),
    enabled: needsPage || needsArticleBody,
  });
  const pageHtml = post.pageHtml ?? pagePost?.pageHtml ?? "";
  const articleBody = post.articleBody ?? pagePost?.articleBody ?? "";
  // Algumas listagens/cache antigos podem não trazer a flag; a leitura detalhada do post é a
  // fonte de reserva para que um spoiler já publicado não apareça aberto ao entrar no post.
  const mediaSpoiler = post.mediaSpoiler ?? pagePost?.mediaSpoiler ?? false;
  // As ações do post (reagir, comentar, compartilhar, salvar, denunciar) moram no `PostActions` —
  // a mesma peça que o post do blog usa. Aqui fica só o card, que é quem inicializa o estado dele.
  const initializePostCard = usePostCardStore((state) => state.initializePostCard);
  const disposePostCard = usePostCardStore((state) => state.disposePostCard);
  const setShowSeals = usePostCardStore((state) => state.setShowSeals);
  // `mySeals` é a lista (backend novo); `mySeal` é o campo antigo, para a janela em que o pod do
  // backend ainda não subiu — sem isso, um selo já dado apareceria apagado.
  const mySeals = seals ? (seals.mySeals ?? (seals.mySeal ? [seals.mySeal] : [])) : [];

  useEffect(() => {
    initializePostCard(post.id);
    return () => disposePostCard(post.id);
  }, [disposePostCard, initializePostCard, post]);

  // A página chega depois do card (requisição própria): preenche o rascunho da edição quando ela
  // aparece, sem atropelar o que o autor já está digitando no diálogo aberto.
  useEffect(() => {
    if (!editOpen) {
      setPageDraft(pageHtml);
      setBodyDraft(articleBody);
    }
  }, [editOpen, pageHtml, articleBody]);

  // O corpo do artigo pode chegar depois de o diálogo abrir: preenche só o campo ainda vazio,
  // para não atropelar quem já começou a editar.
  useEffect(() => {
    if (editOpen && !bodyDraft && articleBody) setBodyDraft(articleBody);
  }, [editOpen, articleBody, bodyDraft]);

  // Post proprio: editar o texto e excluir. O backend confere o dono; a UI so evita mostrar para os outros.
  const editPost = useMutation({
    mutationFn: () =>
      feedApi.update(post.id, {
        content: editType === "PAGE" ? draft.trim() : draft.trim(),
        tags: post.tags,
        // O tipo vai sempre; nulo manteria, mas quem manda e o seletor do dialogo.
        type: editType,
        // Numa pagina o HTML vai junto (o backend recusa PAGE sem ele); num artigo acontece o
        // mesmo com o corpo. Nos outros tipos os campos nem sao enviados.
        ...(editType === "PAGE" ? { pageHtml: pageDraft } : {}),
        ...(editType === "ARTICLE" ? { articleBody: bodyDraft } : {}),
      }),
    onSuccess: () => {
      setEditOpen(false);
      toast(texts.posts.owner.edited);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: savedPostsQueryOptions().queryKey });
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
      queryClient.invalidateQueries({ queryKey: savedPostsQueryOptions().queryKey });
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
    const tipoMudou = editType !== post.type;
    const contentUnchanged = draft.trim() === post.content;
    const pageUnchanged = editType !== "PAGE" || pageDraft === (post.pageHtml ?? "");
    const bodyUnchanged = editType !== "ARTICLE" || bodyDraft.trim() === articleBody.trim();

    // Nada mudou (nem a categoria): fecha sem chamar a API.
    if (
      (editType !== "PAGE" && !draft.trim()) ||
      (!tipoMudou && contentUnchanged && pageUnchanged && bodyUnchanged)
    ) {
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
      queryClient.invalidateQueries({ queryKey: savedPostsQueryOptions().queryKey });
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

  // O nome leva para a identidade que ASSINOU: post profissional abre o perfil profissional
  // (o @ é de outro namespace e não existe em /perfil).
  const authorHref =
    post.authorIdentity === "CORPORATE"
      ? `/profissional/${post.authorUsername}`
      : `/perfil/${post.authorUsername}`;

  return (
    <PostCardView
      post={post}
      hrefs={{
        author: authorHref,
        post: feedTab ? `/post/${post.id}?feedTab=${feedTab}` : `/post/${post.id}`,
        community: post.community ? `/comunidades/${post.community.id}` : null,
        repostOf: post.repostOf ? `/post/${post.repostOf}` : null,
        blog: `/blog/${post.authorUsername}/${post.id}`,
      }}
      timeLabel={formatTime(post.createdAt)}
      editedTimeLabel={formatTime(post.editedAt)}
      topicLabel={
        post.topic ? (TOPIC_LABELS[post.topic as keyof typeof TOPIC_LABELS] ?? post.topic) : null
      }
      anchored={Boolean(feedTab)}
      fullPost={fullPost}
      pinned={pinned}
      onTogglePin={onTogglePin}
      pinPending={pinPending}
      isOwner={isOwner}
      onEdit={() => {
        setDraft(post.content);
        setPageDraft(pageHtml);
        setEditType(post.type);
        setEditOpen(true);
      }}
      onDelete={() => setDeleteOpen(true)}
      seals={seals?.seals}
      mySeals={mySeals}
      onShowSeals={() => setShowSeals(post.id, true)}
      onFollowCommunity={handleFollowCommunity}
      followPending={followCommunity.isPending}
      onOpenPost={() => {
        if (feedTab) {
          saveFeedScroll({ tab: feedTab, postId: post.id, scrollY: window.scrollY });
        }
      }}
      autoplayLinks={!lite}
      pageHtml={pageHtml}
      pageLoading={pageLoading}
      mediaSpoiler={mediaSpoiler}
      page={
        <PostPage
          pageUrl={HAS_CONTENT_ORIGIN ? `${CONTENT_ORIGIN}/pages/${post.id}` : null}
          embedHeight={PAGE_EMBED_HEIGHT}
          frame={
            <SandboxedHtmlFrame
              html={pageHtml}
              title={texts.posts.page.frameTitle}
              className="h-full w-full"
              innerPadding={false}
              // Janela, não faixa: a altura vem do contêiner e o excedente rola dentro do quadro.
              autoHeight={false}
            />
          }
        />
      }
      reactionsSummary={<ReactionsSummary post={post} initialSummary={post.reactionSummary} />}
      notes={<PostNotes post={post} />}
      actions={
        // Selos: entram na fileira das ações (a peça é do card, que é quem sabe os selos do post).
        <PostActions post={post} onComments={toggleComments}>
          <PostSealPicker
            mySeals={mySeals}
            onToggle={(seal) => toggleSeal.mutate(seal)}
            pending={toggleSeal.isPending}
            onRemove={() =>
              sealsApi.remove(post.id).then((result) => {
                queryClient.setQueryData(["seals", post.id], result);
                queryClient.invalidateQueries({ queryKey: ["seals-people", post.id] });
              })
            }
          />
        </PostActions>
      }
      ownerDialogs={
        <>
          <PostEditDialog
            postId={post.id}
            open={editOpen}
            onOpenChange={setEditOpen}
            typeOptions={TYPE_OPTIONS}
            editType={editType}
            onTypeChange={setEditType}
            draft={draft}
            contentField={
              <MentionTextarea
                value={draft}
                maxLength={postContentLimit(editType)}
                toolbar
                onChange={(value) => setDraft(value)}
                placeholder={texts.posts.owner.editDescription}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            }
            pageDraft={pageDraft}
            onPageDraftChange={setPageDraft}
            pageMaxLength={PAGE_HTML_MAX_LENGTH}
            bodyDraft={bodyDraft}
            bodyField={
              <MentionTextarea
                value={bodyDraft}
                maxLength={ARTICLE_BODY_MAX_LENGTH}
                onChange={(value) => setBodyDraft(value)}
                placeholder={
                  pageLoading
                    ? texts.posts.page.loading
                    : texts.feed.composer.article.bodyPlaceholder
                }
                className="min-h-[160px] rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-text-strong"
                rows={6}
                toolbar
              />
            }
            pageLoading={pageLoading}
            pending={editPost.isPending}
            onSave={handleSaveEdit}
          />
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
      }
      comments={
        showComments ? <PostComments postId={post.id} postAuthorId={post.authorId} /> : null
      }
      renderRichText={(props) => <RichText {...props} />}
      renderMediaGrid={(props) => <MediaGrid {...props} />}
      // The mini card is the social profile; a corporate post keeps the link to its own page.
      renderAuthorTrigger={
        post.authorIdentity === "CORPORATE"
          ? undefined
          : (content) => (
              <ProfilePeek username={post.authorUsername} name={post.authorName}>
                {content}
              </ProfilePeek>
            )
      }
    />
  );
}

/**
 * O card é memorizado porque as listas moram em rotas grandes: no feed, cada tecla no compositor
 * (o rascunho é estado da rota) renderizava de novo todos os cards da tela. Com `memo`, o card só
 * renderiza quando o post dele (ou outra prop) muda; o React Query preserva o objeto do post que
 * não mudou entre uma página e outra.
 */
export const PostCard = memo(PostCardContainer);
