import { type ChangeEvent, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PROFILE_HTML_MAX_LENGTH } from "@/constants/profile";
import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { GroupMember } from "@/types/application/group/group-member";
import type { GroupPost } from "@/types/application/group/group-post";
import type { GroupTopic } from "@/types/application/group/group-topic";
import type { GroupView } from "@/types/application/group/group-view";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import {
  ReactionPicker,
  StyledName,
  UserAvatar,
  UserBadges,
} from "@rede-enois/design-system/domain";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Pill,
  Textarea,
  useToast,
} from "@rede-enois/design-system/ui";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  Flag,
  Loader2,
  MessageCircle,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Share2,
  Smile,
  Trash2,
  Users,
} from "lucide-react";

import { groupsApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { useCurrentUser } from "@/lib/current-user";
import { dataHora, hora } from "@/lib/date/format";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { AppContainer } from "@/components/app-container";
import { HtmlEditor } from "@/components/html-editor";
import { MentionTextarea } from "@/components/mention-textarea";
import { formatTime } from "@/components/post/format-time";
import { ReportDialog } from "@/components/post/report-dialog";
import { RichText } from "@/components/post/rich-text";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";
import { ProfilePeek } from "@/components/profile/profile-peek";

export const Route = createFileRoute("/grupos/$slug")({
  head: () => ({ meta: [{ title: texts.groups.seoTitle }] }),
  component: GrupoPage,
});

/**
 * A página do grupo.
 *
 * A apresentação é pública; o feed (tópicos, publicações) só aparece para quem participa — e quem
 * decide isso é o backend, que responde 403 para o resto.
 */
function GrupoPage() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authenticated = useIsAuthenticated();
  const [editOpen, setEditOpen] = useState(false);

  const {
    data: group,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["group", slug],
    queryFn: () => groupsApi.get(slug),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["group", slug] });
    void queryClient.invalidateQueries({ queryKey: ["groups"] });
  };

  const join = useMutation({
    mutationFn: () => groupsApi.join(group!.id),
    onSuccess: (result) => {
      toast(result.status === "MEMBER" ? texts.groups.joined : texts.groups.pending);
      invalidate();
    },
    onError: () => toast(texts.groups.joinError, "error"),
  });

  const leave = useMutation({
    mutationFn: () => groupsApi.leave(group!.id),
    onSuccess: invalidate,
    onError: () => toast(texts.groups.leaveError, "error"),
  });

  if (isLoading) {
    return (
      <AppContainer>
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </AppContainer>
    );
  }

  if (isError || !group) {
    return (
      <AppContainer>
        <p className="py-10 text-center text-sm text-text-subtle">{texts.groups.notFound}</p>
      </AppContainer>
    );
  }

  const canManage = group.viewerRole === "OWNER" || group.viewerRole === "ADMIN";

  // Compartilhar por link: Web Share API quando existe (mobile), copiar para a área de
  // transferência como fallback. O grupo é acessível pelo link para quem não é membro —
  // a página mostra a prévia pública e o botão de entrar.
  const share = async () => {
    const url = `${window.location.origin}/grupos/${group.slug}`;
    const data = { title: group.name, text: group.description ?? group.name, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast(texts.groups.shareCopied, "success");
    } catch (error) {
      // AbortError = usuário cancelou o menu de compartilhar; não é erro.
      if ((error as DOMException)?.name !== "AbortError") {
        toast(texts.groups.shareError, "error");
      }
    }
  };

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
          {group.bannerHtml ? (
            <SandboxedHtmlFrame
              html={group.bannerHtml}
              title={group.name}
              className="h-40 w-full rounded-none border-0 shadow-none"
              autoHeight={false}
            />
          ) : group.banner ? (
            <img src={resolveCdnUrl(group.banner)} alt="" className="h-40 w-full object-cover" />
          ) : (
            <div className="h-40 w-full" style={{ background: "var(--gradient-primary)" }} />
          )}

          <div className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              {group.avatar ? (
                <img
                  src={resolveCdnUrl(group.avatar)}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Users className="h-5 w-5" />
                </span>
              )}

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="min-w-0 wrap-anywhere text-xl font-semibold tracking-tight text-text-strong">
                  {group.name}
                </h1>

                <span className="rounded-full border border-border-soft px-2 py-0.5 text-xs text-text-subtle">
                  {group.joinMode === "OPEN"
                    ? texts.groups.joinModeOpen
                    : texts.groups.joinModeApproval}
                </span>
              </div>
            </div>

            <p className="flex items-center gap-1.5 text-sm text-text-subtle">
              <Users className="h-4 w-4" />

              <>{texts.groups.members(group.members)}</>
            </p>

            {group.description && (
              <p className="whitespace-pre-line wrap-anywhere text-sm text-text-subtle">
                {group.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {group.joined ? (
                <>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                    {texts.groups.joined}
                  </span>

                  <Button
                    variant="outline"
                    className="w-auto rounded-full"
                    disabled={leave.isPending}
                    onClick={() => leave.mutate()}
                  >
                    {texts.groups.leave}
                  </Button>
                </>
              ) : group.requestPending ? (
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                  {texts.groups.pending}
                </span>
              ) : authenticated ? (
                <Button
                  className="w-auto rounded-full"
                  disabled={join.isPending}
                  onClick={() => join.mutate()}
                >
                  {group.joinMode === "OPEN" ? texts.groups.join : texts.groups.requestJoin}
                </Button>
              ) : null}

              {canManage && (
                <Button
                  variant="outline"
                  className="w-auto rounded-full"
                  onClick={() => setEditOpen(true)}
                >
                  {texts.groups.edit}
                </Button>
              )}

              <Button
                variant="outline"
                className="w-auto rounded-full gap-1.5"
                onClick={() => void share()}
              >
                <Share2 className="h-3.5 w-3.5" />
                {texts.groups.share}
              </Button>
            </div>
          </div>
        </div>

        {canManage && <AdminPanel group={group} />}

        {group.joined ? (
          <GroupFeed group={group} />
        ) : (
          <p className="text-sm text-text-subtle">{texts.groups.membersOnly}</p>
        )}

        <EditGroupDialog group={group} open={editOpen} onOpenChange={setEditOpen} />
      </div>
    </AppContainer>
  );
}

/** Feed privado: tópicos, publicações e o compositor. Tudo por endpoints do grupo. */
function GroupFeed({ group }: { group: GroupView }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [topicId, setTopicId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [editingTopic, setEditingTopic] = useState<GroupTopic | null>(null);

  const { data: topicsData } = useQuery({
    queryKey: ["group-topics", group.id],
    queryFn: () => groupsApi.topics(group.id),
  });
  const topics = topicsData?.items ?? [];
  const canManage = group.viewerRole === "OWNER" || group.viewerRole === "ADMIN";
  const canModerate = ["OWNER", "ADMIN", "MODERATOR"].includes(group.viewerRole ?? "");
  const activeTopicId = topicId;
  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? null;

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["group-posts", group.id, activeTopicId],
    queryFn: () => groupsApi.posts(group.id, activeTopicId ?? undefined),
    enabled: group.joined,
  });

  // O fixado pode ser de um tópico que não está aberto (ou de uma página antiga): vem do endpoint
  // próprio e é colocado na frente, sem duplicar quando ele já está na lista.
  const { data: pinnedPost } = useQuery({
    queryKey: ["group-pinned", group.id],
    queryFn: () => groupsApi.pinned(group.id).catch(() => null),
    enabled: group.joined,
  });
  const posts = postsData?.items ?? [];
  const orderedPosts = pinnedPost
    ? [pinnedPost, ...posts.filter((p) => p.id !== pinnedPost.id)]
    : posts;

  const invalidatePosts = () => {
    void queryClient.invalidateQueries({ queryKey: ["group-posts", group.id] });
    void queryClient.invalidateQueries({ queryKey: ["group", group.slug] });
  };

  const publish = useMutation({
    mutationFn: () =>
      groupsApi.publish(group.id, {
        topicId: activeTopicId ?? "",
        content: content.trim(),
      }),
    onSuccess: () => {
      setContent("");
      invalidatePosts();
    },
    // A mensagem do servidor diz o motivo (conta restrita, ECA, topico arquivado): um texto
    // generico escondia exatamente o que a pessoa precisa saber.
    onError: (error) => toast(error.message || texts.groups.publishError, "error"),
  });

  const createTopic = useMutation({
    mutationFn: () => groupsApi.createTopic(group.id, { name: topicName.trim() }),
    onSuccess: () => {
      setTopicName("");
      setNewTopicOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["group-topics", group.id] });
    },
    onError: () => toast(texts.groups.topicCreateError, "error"),
  });

  const renameTopic = useMutation({
    mutationFn: () => groupsApi.updateTopic(group.id, editingTopic!.id, { name: topicName.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["group-topics", group.id] });
      setNewTopicOpen(false);
      setEditingTopic(null);
      setTopicName("");
      toast(texts.groups.topicRenameSuccess, "success");
    },
    onError: (error) => toast(error.message || texts.groups.topicRenameError, "error"),
  });
  const topicSaving = createTopic.isPending || renameTopic.isPending;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium text-text-strong">{texts.groups.topics}</h2>

        {topics.length > 0 && (
          <button
            type="button"
            onClick={() => setTopicId(null)}
            className={
              topicId === null
                ? "max-w-full wrap-anywhere text-left rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
                : "max-w-full wrap-anywhere text-left rounded-full border border-border-soft px-3 py-1 text-xs font-normal text-text-subtle transition hover:text-text-strong"
            }
          >
            {texts.groups.allTopics}
          </button>
        )}

        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => setTopicId(topic.id)}
            className={
              activeTopicId === topic.id
                ? "max-w-full wrap-anywhere text-left rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
                : "max-w-full wrap-anywhere text-left rounded-full border border-border-soft px-3 py-1 text-xs font-normal text-text-subtle transition hover:text-text-strong"
            }
          >
            {topic.name}
            {topic.status === "ARCHIVED" ? " ·" : ""}
          </button>
        ))}

        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="w-auto rounded-full gap-1.5"
            onClick={() => {
              setEditingTopic(null);
              setTopicName("");
              setNewTopicOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />

            <>{texts.groups.newTopic}</>
          </Button>
        )}

        {group.viewerRole === "OWNER" && activeTopic && (
          <Button
            variant="outline"
            size="sm"
            className="w-auto rounded-full gap-1.5"
            onClick={() => {
              setEditingTopic(activeTopic);
              setTopicName(activeTopic.name);
              setNewTopicOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />

            <>{texts.groups.renameTopic}</>
          </Button>
        )}
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-text-subtle">
          {texts.groups.noTopics} {canManage ? texts.groups.noTopicsHint : ""}
        </p>
      ) : (
        <>
          {activeTopic && activeTopic.status === "OPEN" && (
            <div className="space-y-2 rounded-2xl border border-border-soft bg-surface-card p-4">
              <MentionTextarea
                value={content}
                onChange={(value) => setContent(value)}
                placeholder={texts.groups.composerPlaceholder}
                maxLength={1200}
                className="min-h-20 rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-text-strong"
                rows={4}
                toolbar
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="w-auto rounded-full"
                  disabled={!content.trim() || publish.isPending}
                  onClick={() => setContent("")}
                >
                  {texts.common.cancel}
                </Button>

                <Button
                  className="w-auto rounded-full"
                  disabled={!content.trim() || publish.isPending}
                  onClick={() => publish.mutate()}
                >
                  {publish.isPending ? texts.groups.publishing : texts.groups.publish}
                </Button>
              </div>
            </div>
          )}

          {postsLoading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-text-subtle">{texts.groups.feedEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {orderedPosts.map((post) => (
                <GroupPostItem
                  key={post.id}
                  groupId={group.id}
                  post={post}
                  topicName={
                    activeTopicId === null
                      ? topics.find((topic) => topic.id === post.topicId)?.name
                      : undefined
                  }
                  canModerate={canModerate}
                  canPin={canManage}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog
        open={newTopicOpen}
        onOpenChange={(open) => {
          if (!topicSaving) setNewTopicOpen(open);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-normal">
              {editingTopic ? texts.groups.renameTopic : texts.groups.newTopic}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="topicName">{texts.groups.topicName}</Label>

              <Input
                id="topicName"
                value={topicName}
                onChange={(event) => setTopicName(event.target.value)}
                placeholder={texts.groups.topicNamePlaceholder}
                maxLength={80}
                disabled={topicSaving}
              />
            </div>

            <Button
              className="w-full rounded-full"
              disabled={
                !topicName.trim() ||
                topicSaving ||
                (editingTopic !== null && topicName.trim() === editingTopic.name)
              }
              onClick={() => (editingTopic ? renameTopic.mutate() : createTopic.mutate())}
            >
              {topicSaving
                ? texts.common.saving
                : editingTopic
                  ? texts.common.save
                  : texts.groups.createAction}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function GroupPostItem({
  groupId,
  post,
  topicName,
  canModerate,
  canPin,
}: {
  groupId: string;
  post: GroupPost;
  topicName?: string;
  canModerate: boolean;
  canPin: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [commentToRemove, setCommentToRemove] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  // Inscrito na query do /me: o proprio post do grupo so mostrava "excluir" depois que outra
  // consulta redesenhava a tela.
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;

  const remove = useMutation({
    mutationFn: () => groupsApi.removePost(groupId, post.id),
    onSuccess: () => {
      setRemoveOpen(false);
      invalidate();
    },
    onError: () => toast(texts.groups.removePostError, "error"),
  });

  const editComment = useMutation({
    mutationFn: (commentId: string) =>
      groupsApi.editComment(groupId, post.id, commentId, { content: editDraft.trim() }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: () => toast(texts.groups.editCommentError, "error"),
  });

  const removeComment = useMutation({
    mutationFn: (commentId: string) => groupsApi.removeComment(groupId, post.id, commentId),
    onSuccess: () => {
      setCommentToRemove(null);
      invalidate();
    },
    onError: () => toast(texts.groups.removeCommentError, "error"),
  });

  // Um único fixado por grupo: fixar outro substitui o anterior no backend.
  const pin = useMutation({
    mutationFn: async () => {
      if (post.pinned) {
        await groupsApi.unpin(groupId, post.id);
        return;
      }
      await groupsApi.pin(groupId, post.id);
    },
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["group-pinned", groupId] });
    },
    onError: () => toast(texts.posts.pin.error, "error"),
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["group-comments", groupId, post.id],
    queryFn: () => groupsApi.comments(groupId, post.id),
    enabled: showComments,
  });
  const comments = commentsData?.items ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
    void queryClient.invalidateQueries({ queryKey: ["group-comments", groupId, post.id] });
    void queryClient.invalidateQueries({ queryKey: ["group-pinned", groupId] });
  };

  const react = useMutation({
    mutationFn: (type: string) => groupsApi.react(groupId, post.id, type),
    onSuccess: invalidate,
    onError: () => toast(texts.groups.reactError, "error"),
  });

  const sendComment = useMutation({
    mutationFn: () => groupsApi.comment(groupId, post.id, { content: comment.trim() }),
    onSuccess: () => {
      setComment("");
      invalidate();
    },
    onError: () => toast(texts.groups.commentError, "error"),
  });

  const currentReaction = (post.myReaction as ReactionType | null) ?? null;
  const createdTime = hora(post.createdAt);

  return (
    <li className="rounded-2xl border border-border-soft bg-surface-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <ProfilePeek
          username={post.authorUsername}
          userId={post.authorId}
          name={post.authorName ?? ""}
          className="flex min-w-0 items-center gap-2"
        >
          <UserAvatar
            src={post.authorAvatar}
            frame={post.authorAvatarFrame}
            alt={post.authorName ?? ""}
            className="h-8 w-8 shrink-0"
          />

          <span className="min-w-0 wrap-anywhere text-sm font-medium text-text-strong">
            <StyledName name={post.authorName ?? ""} style={post.authorStyle} />
          </span>
        </ProfilePeek>

        <UserBadges badges={post.authorBadges} />

        {post.pinned && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
            <Pin className="h-3 w-3" aria-hidden />

            <>{texts.posts.pin.pinned}</>
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-text-subtle">
        <time dateTime={post.createdAt} title={dataHora(post.createdAt)}>
          {`${formatTime(post.createdAt)} · ${createdTime}`}
        </time>

        {topicName && <span className="wrap-anywhere">{`· ${topicName}`}</span>}
      </div>

      <RichText
        content={post.content}
        className="mt-2 whitespace-pre-line wrap-anywhere text-sm text-text-strong"
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-subtle">
        <ReactionPicker
          emojis={REACTION_EMOJIS}
          activeType={currentReaction}
          onReact={(type) => react.mutate(type)}
          buttonClassName="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-text-subtle transition hover:text-text-strong"
          buttonTitle={texts.groups.react}
        >
          {currentReaction ? (
            <span aria-hidden="true">{REACTION_EMOJIS[currentReaction]}</span>
          ) : (
            <Smile className="h-4 w-4" />
          )}

          <>{String(post.reactions)}</>
        </ReactionPicker>

        <button
          type="button"
          onClick={() => setShowComments((current) => !current)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-text-strong"
        >
          <MessageCircle className="h-4 w-4" />

          <>{`${texts.groups.commentsTitle} (${post.comments})`}</>
        </button>

        {canPin && (
          <button
            type="button"
            onClick={() => pin.mutate()}
            disabled={pin.isPending}
            title={post.pinned ? texts.posts.pin.unpin : texts.posts.pin.pin}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-primary disabled:opacity-50"
          >
            {post.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}

            <>{post.pinned ? texts.posts.pin.unpin : texts.posts.pin.pin}</>
          </button>
        )}

        {(post.authorId === currentUserId || canModerate) && (
          <button
            type="button"
            onClick={() => setRemoveOpen(true)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />

            <>{texts.groups.removeAction}</>
          </button>
        )}

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          title={texts.posts.report.title}
          aria-label={texts.posts.report.title}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition hover:text-text-strong"
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3 border-t border-border-soft pt-3">
          {commentsLoading ? (
            <div className="flex justify-center py-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-text-subtle">{texts.groups.noComments}</p>
          ) : (
            <ul className="space-y-2">
              {comments.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <ProfilePeek
                    username={item.authorUsername}
                    userId={item.authorId}
                    name={item.authorName ?? ""}
                    className="shrink-0"
                  >
                    <UserAvatar
                      src={item.authorAvatar}
                      frame={item.authorAvatarFrame}
                      alt={item.authorName ?? ""}
                      className="h-6 w-6 shrink-0"
                    />
                  </ProfilePeek>

                  <div className="min-w-0">
                    <p className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-text-strong">
                      <ProfilePeek
                        username={item.authorUsername}
                        userId={item.authorId}
                        name={item.authorName ?? ""}
                        className="min-w-0 wrap-anywhere hover:underline"
                      >
                        <StyledName name={item.authorName ?? ""} style={item.authorStyle} />
                      </ProfilePeek>

                      <UserBadges badges={item.authorBadges} />
                    </p>

                    <time
                      dateTime={item.createdAt}
                      title={dataHora(item.createdAt)}
                      className="block text-xs text-text-subtle"
                    >
                      {`${formatTime(item.createdAt)} · ${hora(item.createdAt)}`}
                    </time>

                    {editingId === item.id ? (
                      <div className="mt-1 space-y-2">
                        <Textarea
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                          aria-label={texts.groups.editCommentLabel}
                          maxLength={1200}
                          rows={2}
                          className="min-h-10 rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-text-strong"
                        />

                        <div className="flex items-center gap-2">
                          <Button
                            className="w-auto rounded-full"
                            disabled={!editDraft.trim() || editComment.isPending}
                            onClick={() => {
                              // Sem mudança nenhuma não há o que gravar nem auditar.
                              if (editDraft.trim() === item.content) setEditingId(null);
                              else editComment.mutate(item.id);
                            }}
                          >
                            {editComment.isPending ? texts.common.saving : texts.common.save}
                          </Button>

                          <Button
                            variant="outline"
                            className="w-auto rounded-full"
                            disabled={editComment.isPending}
                            onClick={() => setEditingId(null)}
                          >
                            {texts.common.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <RichText
                        content={item.content}
                        className="whitespace-pre-line wrap-anywhere text-sm text-text-strong"
                      />
                    )}

                    {editingId !== item.id && (
                      <div className="flex flex-wrap items-center gap-x-3">
                        {item.authorId === currentUserId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditDraft(item.content);
                              setEditingId(item.id);
                            }}
                            className="mt-1 inline-flex items-center gap-1 rounded-full py-1 text-xs text-text-subtle transition hover:text-text-strong"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />

                            <>{texts.common.edit}</>
                          </button>
                        )}

                        {(item.authorId === currentUserId || canModerate) && (
                          <button
                            type="button"
                            onClick={() => setCommentToRemove(item.id)}
                            className="mt-1 inline-flex items-center gap-1 rounded-full py-1 text-xs text-text-subtle transition hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />

                            <>{texts.groups.removeAction}</>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end gap-2">
            <MentionTextarea
              value={comment}
              onChange={(value) => setComment(value)}
              placeholder={texts.groups.commentPlaceholder}
              maxLength={1200}
              className="min-h-10 rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-text-strong"
              rows={1}
              toolbar
              onSubmitShortcut={() => {
                if (comment.trim() && !sendComment.isPending) sendComment.mutate();
              }}
            />

            <Button
              className="w-auto rounded-full"
              disabled={!comment.trim() || sendComment.isPending}
              onClick={() => sendComment.mutate()}
            >
              {sendComment.isPending ? texts.groups.commenting : texts.groups.commentAction}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={texts.groups.removePostTitle}
        description={texts.groups.removePostDescription}
        confirmLabel={texts.groups.removeAction}
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
      <ConfirmDialog
        open={commentToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setCommentToRemove(null);
        }}
        title={texts.groups.removeCommentTitle}
        description={texts.groups.removeCommentDescription}
        confirmLabel={texts.groups.removeAction}
        destructive
        pending={removeComment.isPending}
        onConfirm={() => {
          if (commentToRemove) removeComment.mutate(commentToRemove);
        }}
      />
      <ReportDialog
        targetId={post.id}
        targetType="GROUP_POST"
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </li>
  );
}

function EditGroupDialog({
  group,
  open,
  onOpenChange,
}: {
  group: GroupView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [joinMode, setJoinMode] = useState<"OPEN" | "APPROVAL">(group.joinMode);
  const [avatar, setAvatar] = useState(group.avatar ?? "");
  const [banner, setBanner] = useState(group.banner ?? "");
  const [bannerHtml, setBannerHtml] = useState(group.bannerHtml ?? "");
  // Capa foto OU HTML (igual ao perfil): a escolha decide o que vai no PATCH.
  const [bannerMode, setBannerMode] = useState<"photo" | "html">(
    group.bannerHtml ? "html" : "photo",
  );
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: () =>
      groupsApi.update(group.id, {
        name: name.trim(),
        description: description.trim() || null,
        joinMode,
        // Campo presente aplica (e "" remove); ausente (undefined) mantém o atual no servidor.
        avatar: avatar === (group.avatar ?? "") ? undefined : avatar,
        banner:
          bannerMode === "photo"
            ? banner === (group.banner ?? "")
              ? undefined
              : banner
            : group.banner
              ? ""
              : undefined,
        bannerHtml: bannerMode === "html" ? bannerHtml : group.bannerHtml ? "" : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["group", group.slug] });
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      onOpenChange(false);
    },
    onError: () => toast(texts.groups.saveError, "error"),
  });

  const uploadImage = async (file: File, kind: "avatar" | "banner") => {
    try {
      const result = await (kind === "avatar" ? avatarUpload : bannerUpload).upload(
        file,
        kind === "avatar" ? "AVATAR" : "COVER",
      );
      if (kind === "avatar") {
        setAvatar(result.cdnUrl);
      } else {
        setBanner(result.cdnUrl);
        setBannerMode("photo");
      }
    } catch {
      toast(texts.groups.uploadError, "error");
    }
  };

  const chooseFile = (kind: "avatar" | "banner") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploadImage(file, kind);
    event.target.value = "";
  };

  // O hook devolve o estado ESPALHADO ({ status, progress, ... }), não aninhado em `.state`.
  const uploading = avatarUpload.status === "uploading" || bannerUpload.status === "uploading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.groups.editTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{texts.groups.logo}</Label>

            <p className="text-xs font-normal text-text-subtle">{texts.groups.logoHint}</p>

            <div className="flex items-center gap-3">
              {avatar ? (
                <img
                  src={resolveCdnUrl(avatar)}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Users className="h-5 w-5" />
                </span>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-auto rounded-full gap-1.5"
                  disabled={uploading}
                  onClick={() => avatarRef.current?.click()}
                >
                  <Camera className="h-3.5 w-3.5" />

                  <>{avatar ? texts.groups.changeImage : texts.groups.addLogo}</>
                </Button>

                {avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-auto rounded-full"
                    onClick={() => setAvatar("")}
                  >
                    {texts.groups.removeImage}
                  </Button>
                )}
              </div>
            </div>

            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={chooseFile("avatar")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editGroupName">{texts.groups.name}</Label>

            <Input
              id="editGroupName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editGroupDescription">{texts.groups.description}</Label>

            <Textarea
              id="editGroupDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={600}
              className="min-h-20"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-text-strong">{texts.groups.bannerLabel}</p>

            <p className="text-xs font-normal text-text-subtle">{texts.groups.bannerHint}</p>

            <div className="flex gap-1.5" role="tablist" aria-label={texts.groups.bannerLabel}>
              <Pill active={bannerMode === "photo"} onClick={() => setBannerMode("photo")}>
                <>{texts.groups.bannerPhoto}</>
              </Pill>

              <Pill active={bannerMode === "html"} onClick={() => setBannerMode("html")}>
                <>{texts.groups.bannerHtml}</>
              </Pill>
            </div>

            {bannerMode === "html" ? (
              <div className="rounded-2xl border border-border-soft bg-surface-1 p-3">
                <HtmlEditor
                  id="group-banner-html"
                  value={bannerHtml}
                  onChange={setBannerHtml}
                  label={texts.groups.bannerLabel}
                  description={texts.groups.bannerHint}
                  placeholder="<div style='padding:24px'>Capa do grupo</div>"
                  emptyPreview="Sem cabeçalho HTML. A capa em foto (se houver) continua valendo."
                  frameTitle={texts.groups.bannerLabel}
                  maxLength={PROFILE_HTML_MAX_LENGTH}
                  previewClassName="mt-3 h-40 w-full"
                />
              </div>
            ) : banner ? (
              <div className="group relative overflow-hidden rounded-xl border border-border-soft">
                <img src={resolveCdnUrl(banner)} alt="" className="h-28 w-full object-cover" />

                {/* No toque não existe hover: abaixo de md as ações ficam sempre visíveis. */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 transition md:opacity-0 md:group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-auto rounded-full"
                    disabled={uploading}
                    onClick={() => bannerRef.current?.click()}
                  >
                    {texts.groups.changeImage}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-auto rounded-full"
                    onClick={() => setBanner("")}
                  >
                    {texts.groups.removeImage}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full gap-1.5"
                disabled={uploading}
                onClick={() => bannerRef.current?.click()}
              >
                <Camera className="h-4 w-4" />

                <>{texts.groups.addBanner}</>
              </Button>
            )}

            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={chooseFile("banner")}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-text-strong">{texts.groups.joinModeLabel}</p>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "OPEN" as const, label: texts.groups.openLabel },
                  { id: "APPROVAL" as const, label: texts.groups.approvalLabel },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setJoinMode(option.id)}
                  aria-pressed={joinMode === option.id}
                  className={
                    joinMode === option.id
                      ? "rounded-full border border-primary bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary"
                      : "rounded-full border border-border-soft px-3 py-1.5 text-xs font-normal text-text-subtle transition hover:text-text-strong"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full rounded-full"
            disabled={!name.trim() || save.isPending || uploading}
            onClick={() => save.mutate()}
          >
            {save.isPending ? texts.groups.saving : texts.groups.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Administração local: pedidos de ingresso e membros. O backend confere as permissões. */
function AdminPanel({ group }: { group: GroupView }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [removeTarget, setRemoveTarget] = useState<GroupMember | null>(null);
  const [transferTarget, setTransferTarget] = useState<GroupMember | null>(null);
  // Membros nascem FECHADOS (pedido de quem usa): a lista cresce e empurra o resto da página.
  const [membersOpen, setMembersOpen] = useState(false);

  const { data: requestsData } = useQuery({
    queryKey: ["group-requests", group.id],
    queryFn: () => groupsApi.requests(group.id),
  });
  const requests = requestsData?.items ?? [];

  const { data: membersData } = useQuery({
    queryKey: ["group-members", group.id],
    queryFn: () => groupsApi.members(group.id),
  });
  const members = membersData?.items ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["group-requests", group.id] });
    void queryClient.invalidateQueries({ queryKey: ["group-members", group.id] });
    void queryClient.invalidateQueries({ queryKey: ["group", group.slug] });
  };

  const decide = useMutation({
    mutationFn: ({ requestId, approve }: { requestId: string; approve: boolean }) =>
      approve ? groupsApi.approve(group.id, requestId) : groupsApi.reject(group.id, requestId),
    onSuccess: invalidate,
    onError: () => toast(texts.groups.requestError, "error"),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(group.id, userId),
    onSuccess: () => {
      setRemoveTarget(null);
      invalidate();
    },
    onError: () => toast(texts.groups.removeError, "error"),
  });

  const transfer = useMutation({
    mutationFn: (userId: string) => groupsApi.transfer(group.id, userId),
    onSuccess: () => {
      setTransferTarget(null);
      invalidate();
    },
    onError: () => toast(texts.groups.transferError, "error"),
  });

  const isOwner = group.viewerRole === "OWNER";
  const roleLabel = (role: GroupMember["role"]) =>
    role === "OWNER"
      ? texts.groups.roleOwner
      : role === "ADMIN"
        ? texts.groups.roleAdmin
        : role === "MODERATOR"
          ? texts.groups.roleModerator
          : texts.groups.roleMember;
  const nameOf = (member: { name: string | null; username: string | null }) =>
    member.name ?? member.username ?? "";

  return (
    <section className="space-y-5 rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
      <h2 className="text-sm font-medium text-text-strong">{texts.groups.adminTitle}</h2>

      <div className="space-y-2">
        <h3 className="text-xs font-medium text-text-strong">{texts.groups.requestsTitle}</h3>

        {requests.length === 0 ? (
          <p className="text-xs text-text-subtle">{texts.groups.noRequests}</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-1 px-3 py-2"
              >
                <ProfilePeek
                  username={request.username}
                  userId={request.userId}
                  name={nameOf(request)}
                  className="flex min-w-[10rem] flex-1 items-center gap-2"
                >
                  <UserAvatar
                    src={request.avatar}
                    alt={request.name ?? ""}
                    className="h-7 w-7 shrink-0"
                  />

                  <span className="min-w-0 truncate text-sm text-text-strong">
                    <StyledName name={nameOf(request)} style={request.nameStyle} />
                  </span>
                </ProfilePeek>

                <Button
                  size="sm"
                  className="w-auto rounded-full"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ requestId: request.id, approve: true })}
                >
                  {texts.groups.approve}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-auto rounded-full"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ requestId: request.id, approve: false })}
                >
                  {texts.groups.reject}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setMembersOpen((value) => !value)}
          aria-expanded={membersOpen}
          className="flex w-full items-center gap-1.5 text-xs font-medium text-text-strong transition hover:opacity-80"
        >
          {membersOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          <>{texts.groups.membersTitle}</>

          <span className="font-normal text-text-subtle">({members.length})</span>
        </button>

        {membersOpen && (
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.userId}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-1 px-3 py-2"
              >
                <ProfilePeek
                  username={member.username}
                  userId={member.userId}
                  name={nameOf(member)}
                  className="flex min-w-[10rem] flex-1 items-center gap-2"
                >
                  <UserAvatar
                    src={member.avatar}
                    alt={member.name ?? ""}
                    className="h-7 w-7 shrink-0"
                  />

                  <span className="min-w-0 truncate text-sm text-text-strong">
                    <StyledName name={nameOf(member)} style={member.nameStyle} />
                  </span>
                </ProfilePeek>

                <span className="text-xs text-text-subtle">{roleLabel(member.role)}</span>

                {member.role !== "OWNER" && (
                  <>
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-auto rounded-full"
                        onClick={() => setTransferTarget(member)}
                      >
                        {texts.groups.transfer}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-auto rounded-full text-destructive"
                      onClick={() => setRemoveTarget(member)}
                    >
                      {texts.groups.removeMember}
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={texts.groups.removeMemberTitle(removeTarget ? nameOf(removeTarget) : "")}
        description={texts.groups.removeMemberDescription}
        confirmLabel={texts.groups.removeMember}
        destructive
        pending={removeMember.isPending}
        onConfirm={() => removeTarget && removeMember.mutate(removeTarget.userId)}
      />
      <ConfirmDialog
        open={transferTarget !== null}
        onOpenChange={(open) => !open && setTransferTarget(null)}
        title={texts.groups.transferTitle(transferTarget ? nameOf(transferTarget) : "")}
        description={texts.groups.transferDescription}
        confirmLabel={texts.groups.transfer}
        pending={transfer.isPending}
        onConfirm={() => transferTarget && transfer.mutate(transferTarget.userId)}
      />
    </section>
  );
}
