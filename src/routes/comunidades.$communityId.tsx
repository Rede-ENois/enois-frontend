import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { postContentLimit } from "@/constants/post-content-limits";
import { PAGE_HTML_MAX_LENGTH } from "@/constants/post-page";
import { ARTICLE_BODY_MAX_LENGTH, POST_TYPES } from "@/constants/post-types";
import { PROFILE_HTML_MAX_LENGTH } from "@/constants/profile";
import { texts } from "@/texts";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { PostView } from "@/types/application/feed/post-view";
import type { CommunityCropPurpose } from "@/types/routes/communities/community-crop-purpose";
import type { EditCommunityFormProps } from "@/types/routes/communities/edit-community-form-props";
import type { MediaItem } from "@/types/routes/feed/media-item";
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  Crown,
  EyeOff,
  Paperclip,
  Send,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { communitiesApi, feedApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { buildShareTags } from "@/lib/open-graph";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill } from "@/components/ui/pill";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { CommunityChannels } from "@/components/communities/community-channels";
import { CommunityFavoriteButton } from "@/components/community-favorite-button";
import { HtmlEditor } from "@/components/html-editor";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { MentionTextarea } from "@/components/mention-textarea";
import { PostCard } from "@/components/post-card";
import { RichText } from "@/components/post/rich-text";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";
import { SpoilerPreview } from "@/components/post/spoiler-preview";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/comunidades/$communityId")({
  loader: async ({ params }) => {
    try {
      return await communitiesApi.get(params.communityId);
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => {
    const title = `${loaderData?.name ?? texts.communities.detail.seoFallback} · ${texts.brand.name}`;
    return {
      meta: buildShareTags({
        title,
        description: loaderData?.description || "Conheça esta comunidade no Énóis.",
        url: `${texts.siteUrl}/comunidades/${encodeURIComponent(params.communityId)}`,
        imageUrl:
          resolveCdnUrl(loaderData?.cover || loaderData?.avatar) ||
          `${texts.siteUrl}/icons/icon-512.png`,
        imageAlt: loaderData?.name ? `Comunidade ${loaderData.name} no Énóis` : title,
      }),
    };
  },
  component: CommunityDetail,
});

function CommunityDetail() {
  const queryClient = useQueryClient();
  const community = Route.useLoaderData();
  const { user: currentUser, requireAuth: needsLogin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  // Mesmos recursos do composer do feed: tipo de publicação, mídia, página em HTML, menções e o
  // corpo do artigo (o backend exige o corpo em ARTICLE — sem o campo, publicar artigo numa
  // comunidade só dava erro).
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaSpoiler, setMediaSpoiler] = useState(false);
  const [pageHtml, setPageHtml] = useState("");
  const [articleBody, setArticleBody] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload();
  const pageMode = postType === "PAGE";
  const articleMode = postType === "ARTICLE";
  const currentType = POST_TYPES.find((option) => option.id === postType) ?? POST_TYPES[0];
  const [editOpen, setEditOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // `joined` depende de QUEM pergunta, e o SSR nao tem sessao: o dado do loader chega com
  // joined=false. Com o staleTime global de 30s esse dado valia como fresco no cliente, entao a
  // pagina ficava mostrando "Entrar" (e escondendo o composer) para quem ja era membro — so
  // destravava depois de 30s ou ao trocar de aba. staleTime 0 forca a confirmacao no cliente
  // assim que a pagina monta.
  const { data: live } = useQuery({
    queryKey: ["community", community.id],
    queryFn: () => communitiesApi.get(community.id),
    initialData: community,
    staleTime: 0,
  });

  // O `joined` do loader vem de uma consulta SEM sessao (SSR), entao e desconhecido ate a
  // primeira consulta do cliente (com sessao) responder. Enquanto isso, o CTA fica neutro:
  // nunca mostrar "Entrar" para um membro por causa do dado anonimo do link (relato do Augusto).
  const [viewerConfirmed, setViewerConfirmed] = useState(false);
  useEffect(() => {
    setViewerConfirmed(true);
  }, [live]);

  const { data: membersData } = useQuery({
    queryKey: ["community", community.id, "members"],
    queryFn: () => communitiesApi.getMembers(community.id),
  });

  const { data: feedData } = useQuery({
    queryKey: ["community", community.id, "feed"],
    queryFn: () => communitiesApi.getFeed(community.id),
  });

  // O fixado é um estado da comunidade (não do post), então vem de um endpoint próprio e pode
  // não estar na página carregada do feed — por isso a lista é montada com ele na frente.
  const { data: pinnedPost } = useQuery({
    queryKey: ["community", community.id, "pinned"],
    queryFn: () => communitiesApi.pinned(community.id).catch(() => null),
  });

  const members = membersData?.items ?? [];
  const posts = feedData?.items ?? [];
  const orderedPosts = pinnedPost
    ? [pinnedPost, ...posts.filter((p) => p.id !== pinnedPost.id)]
    : posts;

  const join = useMutation({
    mutationFn: () => communitiesApi.join(community.id),
    onSuccess: () => {
      toast(texts.communities.joined);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["community", community.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
    },
    onError: () => toast(texts.communities.actionError, "error"),
  });

  const leave = useMutation({
    mutationFn: () => communitiesApi.leave(community.id),
    onSuccess: () => {
      setLeaveOpen(false);
      toast(texts.communities.left);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
    },
    onError: () => {
      // O dono não sai sem transferir: em vez de um erro seco, oferecemos a transferência.
      setLeaveOpen(false);
      setTransferOpen(true);
    },
  });

  const transfer = useMutation({
    mutationFn: (newOwnerId: string) => communitiesApi.transfer(community.id, newOwnerId),
    onSuccess: () => {
      setTransferOpen(false);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["community", community.id, "members"] });
    },
  });

  const removeCommunity = useMutation({
    mutationFn: () => communitiesApi.remove(community.id),
    onSuccess: () => {
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      navigate({ to: "/comunidades" });
    },
  });

  const createPost = useMutation({
    mutationFn: (input: CreatePostInput) => feedApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id, "feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setDraft("");
      setMedia([]);
      setMediaSpoiler(false);
      setPageHtml("");
      setArticleBody("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      setPublishError(null);
    },
    onError: (error) =>
      setPublishError(error instanceof Error ? error.message : texts.feed.composer.publishError),
  });

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    // Pagina e uma coisa OU outra (o HTML e o conteudo); artigo precisa do texto de cima E do corpo
    // — as mesmas regras do composer do feed.
    if (pageMode ? !pageHtml.trim() : !content) return;
    if (articleMode && !articleBody.trim()) return;

    setPublishError(null);
    try {
      let mediaIds: string[] = [];
      if (!pageMode && media.length > 0) {
        const results = await upload.uploadAll(media.map((item) => ({ file: item.file })));
        mediaIds = results.map((result) => result.mediaId);
      }
      await createPost.mutateAsync({
        type: postType,
        content: pageMode ? "" : content,
        communityId: community.id,
        mediaIds,
        mediaSpoiler,
        ...(pageMode ? { pageHtml } : {}),
        ...(articleMode ? { articleBody } : {}),
        mentionedUserIds: pageMode ? [] : mentionedUserIds,
      });
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : texts.feed.composer.publishError);
    }
  };

  const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;

      const hasImages = media.some((item) => item.type === "image");
      const hasVideo = media.some((item) => item.type === "video");
      if (isVideo && (hasImages || hasVideo || media.length >= 1)) break;
      if (isImage && hasVideo) break;
      if (isImage && media.length >= 4) break;

      const preview = URL.createObjectURL(file);
      setMedia((current) => [...current, { type: isVideo ? "video" : "image", file, preview }]);
    }
    event.target.value = "";
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["community", community.id] });
  };

  const isMember = live.joined;
  const admins = members.filter((m) => m.role === "ADMIN");
  const isAdmin = currentUser ? admins.some((a) => a.userId === currentUser.id) : false;

  const togglePin = useMutation({
    mutationFn: (post: PostView) =>
      pinnedPost?.id === post.id
        ? communitiesApi.unpin(community.id)
        : communitiesApi.pin(community.id, post.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["community", community.id, "feed"] });
      void queryClient.invalidateQueries({ queryKey: ["community", community.id, "pinned"] });
    },
    onError: () => toast(texts.posts.pin.error, "error"),
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <Link
          to="/comunidades"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.communities.title}</>
        </Link>

        <div className="surface-card overflow-hidden">
          {live.bannerHtml ? (
            // Capa em HTML/CSS: mesmo espaço da foto, quadro isolado sem script (igual à do perfil).
            // `clip` é o delimitador da faixa — ver o comentário na capa do perfil.
            <SandboxedHtmlFrame
              html={live.bannerHtml}
              title={texts.communities.detail.bannerHtml.frameTitle}
              className="h-48 w-full rounded-none border-0 shadow-none"
              innerPadding={false}
              autoHeight={false}
            />
          ) : live.cover ? (
            <img src={resolveCdnUrl(live.cover)} alt="" className="h-48 w-full object-cover" />
          ) : (
            <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                {live.avatar && (
                  <img
                    src={resolveCdnUrl(live.avatar)}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-card shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
                    {live.topic}
                  </Badge>

                  <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight">
                    {live.name}
                  </h1>

                  {live.description && (
                    <RichText
                      content={live.description}
                      className="mt-1 break-words text-muted-foreground"
                    />
                  )}

                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4" />

                      <>{texts.communities.memberCount(live.members)}</>
                    </span>
                    {admins.length > 0 && (
                      <span>
                        <>{texts.communities.detail.createdBy}</>

                        <Link
                          to="/perfil/$username"
                          params={{ username: admins[0].username }}
                          className="font-medium text-foreground hover:underline"
                        >
                          {admins[0].name}
                        </Link>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* flex-wrap + w-auto: o tamanho default do Button e `w-full`, entao os botoes de
                  admin brigavam por espaco e estouravam a linha no celular. */}
              <div className="flex flex-wrap items-center gap-2">
                <CommunityFavoriteButton communityId={community.id} />

                {isAdmin && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-auto rounded-full gap-1.5">
                        <Settings className="h-4 w-4" />

                        <>{texts.communities.detail.edit}</>
                      </Button>
                    </DialogTrigger>

                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{texts.communities.detail.editTitle}</DialogTitle>
                      </DialogHeader>

                      <EditCommunityForm community={live} onClose={() => setEditOpen(false)} />
                    </DialogContent>
                  </Dialog>
                )}
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      className="w-auto rounded-full gap-1.5"
                      aria-label={texts.communities.transfer.action}
                      title={texts.communities.transfer.action}
                      onClick={() => setTransferOpen(true)}
                    >
                      <Crown className="h-4 w-4" />

                      <span className="hidden sm:inline">{texts.communities.transfer.action}</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-auto rounded-full gap-1.5 text-destructive"
                      aria-label={texts.communities.delete.action}
                      title={texts.communities.delete.action}
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  className="w-auto rounded-full whitespace-nowrap"
                  variant={viewerConfirmed && isMember ? "secondary" : "default"}
                  disabled={join.isPending || leave.isPending || !viewerConfirmed}
                  onClick={() => {
                    if (viewerConfirmed && isMember) {
                      setLeaveOpen(true);
                      return;
                    }
                    // Visitante nao tem sessao: manda para o login em vez de tomar 401.
                    if (needsLogin()) join.mutate();
                  }}
                >
                  {!viewerConfirmed
                    ? "…"
                    : isMember
                      ? texts.communities.participating
                      : texts.communities.enter}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          title={texts.communities.leave.title}
          description={
            isAdmin
              ? texts.communities.ownerLeaveBlocked
              : texts.communities.leave.description(live.name)
          }
          confirmLabel={texts.communities.leave.confirm}
          destructive
          pending={leave.isPending}
          onConfirm={() =>
            isAdmin ? (setLeaveOpen(false), setTransferOpen(true)) : leave.mutate()
          }
        />

        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{texts.communities.transfer.title}</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              {texts.communities.transfer.description}
            </p>

            <div className="max-h-72 space-y-1 overflow-y-auto">
              {members
                .filter((m) => m.userId !== currentUser?.id)
                .map((m) => (
                  <button
                    key={m.userId}
                    disabled={transfer.isPending}
                    onClick={() => transfer.mutate(m.userId)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-muted disabled:opacity-60"
                  >
                    <UserAvatar src={resolveCdnUrl(m.avatar)} alt={m.name} className="h-8 w-8" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.name}</p>

                      <p className="truncate text-xs text-muted-foreground">@{m.username}</p>
                    </div>
                  </button>
                ))}

              {members.filter((m) => m.userId !== currentUser?.id).length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  {texts.communities.transfer.empty}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={texts.communities.delete.title}
          description={texts.communities.delete.description}
          confirmLabel={texts.communities.delete.confirm}
          destructive
          pending={removeCommunity.isPending}
          onConfirm={() => removeCommunity.mutate()}
        />
        <CommunityChannels communityId={community.id} joined={isMember} />

        {isMember && (
          <form onSubmit={publish} className="surface-card p-5">
            {!pageMode && (
              <MentionTextarea
                value={draft}
                onChange={(value, ids) => {
                  setDraft(value);
                  setMentionedUserIds(ids);
                }}
                placeholder={texts.communities.detail.composerPlaceholder}
                className="min-h-20 rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm font-normal"
                maxLength={postContentLimit(postType)}
                toolbar
              />
            )}

            {pageMode && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border-soft bg-surface-1 p-3">
                <HtmlEditor
                  id="community-page-html"
                  value={pageHtml}
                  onChange={setPageHtml}
                  label={texts.feed.composer.pageLabel}
                  description={texts.feed.composer.pageDescription}
                  placeholder={texts.feed.composer.pagePlaceholder}
                  emptyPreview={texts.feed.composer.pageEmpty}
                  frameTitle={texts.posts.page.frameTitle}
                  maxLength={PAGE_HTML_MAX_LENGTH}
                  innerPadding={false}
                  previewClassName="-mx-3 -mb-3 mt-3 h-[360px] w-full"
                />
              </div>
            )}

            {articleMode && (
              <div className="mt-3 rounded-2xl border border-border-soft bg-surface-1 p-3">
                <span className="mb-1 block text-sm font-normal text-text-subtle">
                  {texts.feed.composer.article.bodyLabel}
                </span>

                <p className="mb-2 text-sm font-normal text-text-subtle">
                  {texts.feed.composer.article.bodyHint}
                </p>

                <MentionTextarea
                  value={articleBody}
                  maxLength={ARTICLE_BODY_MAX_LENGTH}
                  onChange={(value) => setArticleBody(value)}
                  placeholder={texts.feed.composer.article.bodyPlaceholder}
                  className="min-h-[220px] rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-text-strong"
                  rows={8}
                  toolbar
                />
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTypePickerOpen((open) => !open)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition ${
                      typePickerOpen
                        ? "bg-primary text-primary-foreground"
                        : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
                    }`}
                  >
                    <currentType.icon className="h-3.5 w-3.5" />

                    <>
                      {texts.feed.composer.typePicker.label}: {currentType.label}
                    </>

                    <ChevronDown
                      className={`h-3.5 w-3.5 transition ${typePickerOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {typePickerOpen && (
                    <div className="absolute bottom-full left-0 z-40 mb-1 w-[min(22rem,80vw)] rounded-2xl border border-border-soft bg-popover p-2 shadow-lg">
                      <div className="flex flex-wrap gap-1.5">
                        {POST_TYPES.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setPostType(option.id as PostView["type"]);
                              setTypePickerOpen(false);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition ${
                              option.id === postType
                                ? "bg-primary text-primary-foreground"
                                : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
                            }`}
                          >
                            <option.icon className="h-3.5 w-3.5" />

                            <>{option.label}</>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Anexo: mesmo clipe do resto do composer, com a contagem quando já tem arquivo. */}
                {!pageMode && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    title={texts.feed.composer.media}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition ${
                      media.length > 0
                        ? "bg-primary text-primary-foreground"
                        : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
                    }`}
                  >
                    <Paperclip className="h-3.5 w-3.5" />

                    <>
                      {media.length > 0
                        ? texts.feed.composer.mediaCount(media.length)
                        : texts.feed.composer.media}
                    </>
                  </button>
                )}

                {!pageMode && media.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMediaSpoiler((active) => !active)}
                    title={mediaSpoiler ? texts.feed.composer.mediaSpoilerActive : texts.feed.composer.mediaSpoiler}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition ${
                      mediaSpoiler
                        ? "bg-primary text-primary-foreground"
                        : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
                    }`}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    {mediaSpoiler ? texts.feed.composer.mediaSpoilerActive : texts.feed.composer.mediaSpoiler}
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaSelect}
                />
              </div>

              <Button
                size="sm"
                className="rounded-full gap-1.5"
                disabled={
                  (pageMode ? !pageHtml.trim() : !draft.trim()) ||
                  (articleMode && !articleBody.trim()) ||
                  createPost.isPending ||
                  upload.status === "uploading"
                }
              >
                <Send className="h-4 w-4" />

                <>
                  {createPost.isPending || upload.status === "uploading"
                    ? upload.status === "uploading"
                      ? texts.common.sending
                      : texts.common.publishing
                    : texts.common.publish}
                </>
              </Button>
            </div>

            {media.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {media.map((item, index) => (
                  <div
                    key={index}
                    className="relative h-20 w-20 overflow-hidden rounded-xl border border-border-soft"
                  >
                    <SpoilerPreview
                      active={mediaSpoiler}
                      label={texts.posts.mediaSpoiler.badge}
                      className="h-full w-full"
                    >
                      <img src={item.preview} alt="" className="h-full w-full object-cover" />
                    </SpoilerPreview>

                    <button
                      type="button"
                      onClick={() =>
                        setMedia((current) => {
                          URL.revokeObjectURL(current[index].preview);
                          const next = current.filter((_, i) => i !== index);
                          if (next.length === 0) setMediaSpoiler(false);
                          return next;
                        })
                      }
                      aria-label={texts.common.remove}
                      title={texts.common.remove}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-surface-card/80 text-text-strong"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {publishError && (
              <p className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-normal text-destructive">
                {publishError}
              </p>
            )}
          </form>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{texts.communities.detail.feed}</h2>
            {orderedPosts.length === 0 ? (
              <p className="surface-card p-8 text-center text-sm text-muted-foreground">
                {isMember
                  ? texts.communities.detail.emptyMember
                  : texts.communities.detail.emptyGuest}
              </p>
            ) : (
              orderedPosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  pinned={p.id === pinnedPost?.id}
                  onTogglePin={isAdmin ? () => togglePin.mutate(p) : undefined}
                  pinPending={togglePin.isPending}
                />
              ))
            )}
          </div>

          <aside className="space-y-4">
            <div className="surface-card p-5">
              <h3 className="mb-3 text-sm font-semibold">
                {texts.communities.detail.membersTitle(members.length)}
              </h3>

              <div className="space-y-3">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3">
                    <Link to="/perfil/$username" params={{ username: m.username }}>
                      <UserAvatar src={m.avatar} alt={m.name} className="h-9 w-9 shrink-0" />
                    </Link>

                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {/* `block` é necessário: truncate não pega em elemento inline (o <a> era inline
                          e nomes longos vazavam para fora do card). */}
                      <Link
                        to="/perfil/$username"
                        params={{ username: m.username }}
                        className="block min-w-0 truncate text-sm font-medium hover:underline"
                      >
                        {m.name}
                      </Link>
                      {m.role === "ADMIN" && (
                        <Badge
                          variant="outline"
                          className="shrink-0 rounded-full text-xs px-1.5 py-0"
                        >
                          {texts.communities.detail.admin}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppContainer>
  );
}

function EditCommunityForm({ community, onClose }: EditCommunityFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description ?? "");
  const [cover, setCover] = useState(community.cover ?? "");
  const [avatar, setAvatar] = useState(community.avatar ?? "");
  const coverUpload = useMediaUpload();
  const avatarUpload = useMediaUpload();
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPurpose, setCropPurpose] = useState<CommunityCropPurpose | null>(null);
  // Capa foto OU HTML (igual ao perfil): a escolha decide o que vai no PATCH.
  const [bannerMode, setBannerMode] = useState<"photo" | "html">(
    community.bannerHtml ? "html" : "photo",
  );
  const [bannerHtml, setBannerHtml] = useState(community.bannerHtml ?? "");
  // O tópico muda depois de criada: a comunidade cresce e muda de assunto, e antes não havia
  // como corrigir — o valor ficava congelado no que foi escolhido no dia da criação.
  const [topic, setTopic] = useState<CommunityTopic>(community.topic);

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      const upload = cropPurpose === "COVER" ? coverUpload : avatarUpload;
      const result = await upload.upload(
        new File([blob], "crop.jpg", { type: "image/jpeg" }),
        cropPurpose!,
      );
      if (cropPurpose === "COVER") setCover(result.cdnUrl);
      else setAvatar(result.cdnUrl);
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
      setCropPurpose(null);
    },
    [cropPurpose, cropImageSrc, coverUpload, avatarUpload],
  );

  const handleCropCancel = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  const handleFileSelect = (field: CommunityCropPurpose) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropPurpose(field);
    setCropImageSrc(URL.createObjectURL(file));
  };

  const update = useMutation({
    mutationFn: () =>
      communitiesApi.update(community.id, {
        name: name !== community.name ? name : undefined,
        description: description !== community.description ? description : undefined,
        topic: topic !== community.topic ? topic : undefined,
        cover: cover || null,
        avatar: avatar || null,
        // Modo foto com HTML existente limpa o HTML (a foto volta a ser a capa); sem HTML, nao mexe.
        bannerHtml: bannerMode === "html" ? bannerHtml : community.bannerHtml ? "" : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id] });
      onClose();
    },
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.create.name}</Label>

        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.create.topic}</Label>

        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value as CommunityTopic)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-transparent bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {TOPICS.filter((t) => t !== "Todas").map((t) => (
            <option key={t} value={t}>
              {TOPIC_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {texts.communities.create.description}
        </Label>

        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.detail.cover}</Label>

        <div
          className="flex gap-1.5"
          role="tablist"
          aria-label={texts.communities.detail.bannerHtml.title}
        >
          <Pill active={bannerMode === "photo"} onClick={() => setBannerMode("photo")}>
            <>{texts.communities.detail.bannerHtml.photoTab}</>
          </Pill>

          <Pill active={bannerMode === "html"} onClick={() => setBannerMode("html")}>
            <>{texts.communities.detail.bannerHtml.htmlTab}</>
          </Pill>
        </div>

        {bannerMode === "html" && (
          <div className="rounded-2xl border border-border-soft bg-surface-1 p-3">
            <HtmlEditor
              id="community-banner-html"
              value={bannerHtml}
              onChange={setBannerHtml}
              label={texts.communities.detail.bannerHtml.label}
              description={texts.communities.detail.bannerHtml.description}
              placeholder={texts.communities.detail.bannerHtml.placeholder}
              emptyPreview={texts.communities.detail.bannerHtml.empty}
              frameTitle={texts.communities.detail.bannerHtml.frameTitle}
              maxLength={PROFILE_HTML_MAX_LENGTH}
              previewClassName="mt-3 h-48 w-full"
            />
          </div>
        )}

        {bannerMode === "photo" &&
          (cover ? (
            <div className="group relative overflow-hidden rounded-xl border border-border">
              <img src={cover} alt="" className="h-24 w-full object-cover" />

              {/* No toque não existe hover: abaixo de md as ações ficam sempre visíveis, senão
                era impossível trocar ou remover a capa pelo celular. */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 transition md:opacity-0 md:group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => coverRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />

                  <>{texts.communities.detail.change}</>
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCover("")}
                >
                  {texts.communities.detail.remove}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full gap-1.5"
              onClick={() => coverRef.current?.click()}
            >
              <Camera className="h-4 w-4" />

              <>{texts.communities.detail.addCover}</>
            </Button>
          ))}
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect("COVER")}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.detail.avatar}</Label>
        {avatar ? (
          <div className="flex items-center gap-3">
            <img
              src={avatar}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => avatarRef.current?.click()}
              >
                <Camera className="h-4 w-4" />

                <>{texts.communities.detail.change}</>
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={() => setAvatar("")}
              >
                {texts.communities.detail.remove}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full gap-1.5"
            onClick={() => avatarRef.current?.click()}
          >
            <Camera className="h-4 w-4" />

            <>{texts.communities.detail.addAvatar}</>
          </Button>
        )}
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect("AVATAR")}
        />
      </div>

      <Button
        className="w-full rounded-full"
        disabled={!name.trim() || update.isPending}
        onClick={() => update.mutate()}
      >
        {update.isPending ? texts.common.saving : texts.common.save}
      </Button>

      {cropImageSrc && cropPurpose && (
        <ImageCropDialog
          open={!!cropImageSrc}
          onOpenChange={(v) => {
            if (!v) handleCropCancel();
          }}
          imageSrc={cropImageSrc}
          aspect={cropPurpose === "COVER" ? 3 : 1}
          title={
            cropPurpose === "COVER"
              ? texts.communities.detail.cropCover
              : texts.communities.detail.cropAvatar
          }
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
