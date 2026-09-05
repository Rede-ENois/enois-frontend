import { type FormEvent, useCallback, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { ArrowLeft, Camera, Send, Settings, Users } from "lucide-react";

import { communitiesApi, feedApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import {
  buildCommunityUpdate,
  type CommunityCropPurpose,
} from "@/utils/community";
import { createObjectUrl, getFirstFile, revokeObjectUrl } from "@/utils/files";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { AppContainer } from "@/components/app-container";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/comunidades/$communityId")({
  beforeLoad: requireAuth,
  loader: async ({ params }) => {
    try {
      return await communitiesApi.get(params.communityId);
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.name ?? texts.communities.detail.seoFallback} · ${texts.brand.name}`,
      },
    ],
  }),
  component: CommunityDetail,
});

function CommunityDetail() {
  const queryClient = useQueryClient();
  const community = Route.useLoaderData();
  const { user: currentUser } = useAuth();
  const [draft, setDraft] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const { data: live } = useQuery({
    queryKey: ["community", community.id],
    queryFn: () => communitiesApi.get(community.id),
    initialData: community,
  });

  const { data: membersData } = useQuery({
    queryKey: ["community", community.id, "members"],
    queryFn: () => communitiesApi.getMembers(community.id),
  });

  const { data: feedData } = useQuery({
    queryKey: ["community", community.id, "feed"],
    queryFn: () => communitiesApi.getFeed(community.id),
  });

  const members = membersData?.items ?? [];
  const posts = feedData?.items ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["community", community.id] });
  };

  const join = useMutation({
    mutationFn: () => communitiesApi.join(community.id),
    onSuccess: invalidate,
  });
  const leave = useMutation({
    mutationFn: () => communitiesApi.leave(community.id),
    onSuccess: invalidate,
  });

  const createPost = useMutation({
    mutationFn: (content: string) =>
      feedApi.create({ type: "INSIGHT", content, communityId: community.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id, "feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setDraft("");
    },
  });

  const handlePost = (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (content) createPost.mutate(content);
  };

  const isMember = live.joined;
  const admins = members.filter((member) => member.role === "ADMIN");
  const isAdmin = Boolean(currentUser && admins.some((admin) => admin.userId === currentUser.id));

  const membershipActions = {
    member: {
      label: texts.communities.participating,
      variant: "secondary" as const,
      run: () => leave.mutate(),
    },
    guest: {
      label: texts.communities.enter,
      variant: "default" as const,
      run: () => join.mutate(),
    },
  };
  const membershipAction = membershipActions[isMember ? "member" : "guest"];
  const emptyFeedText = {
    member: texts.communities.detail.emptyMember,
    guest: texts.communities.detail.emptyGuest,
  }[isMember ? "member" : "guest"];

  return (
    <AppContainer>
      <div className="space-y-6">
        <Link
          to="/comunidades"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {texts.communities.title}
        </Link>

        <div className="surface-card overflow-hidden">
          {live.cover ? (
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
                  <p className="mt-1 break-words text-muted-foreground">{live.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> {texts.communities.memberCount(live.members)}
                    </span>
                    {admins.length > 0 && (
                      <span>
                        {texts.communities.detail.createdBy}{" "}
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
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-full gap-1.5">
                        <Settings className="h-4 w-4" /> {texts.communities.detail.edit}
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
                <Button
                  className="rounded-full shrink-0"
                  variant={membershipAction.variant}
                  disabled={join.isPending || leave.isPending}
                  onClick={membershipAction.run}
                >
                  {membershipAction.label}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isMember && (
          <form onSubmit={handlePost} className="surface-card p-5">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={texts.communities.detail.composerPlaceholder}
              className="min-h-20 resize-none rounded-2xl border-border bg-muted/40 text-sm"
              maxLength={1024}
            />
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                className="rounded-full gap-1.5"
                disabled={!draft.trim() || createPost.isPending}
              >
                <Send className="h-4 w-4" />
                {createPost.isPending ? texts.common.publishing : texts.common.publish}
              </Button>
            </div>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{texts.communities.detail.feed}</h2>
            {posts.length === 0 ? (
              <p className="surface-card p-8 text-center text-sm text-muted-foreground">
                {emptyFeedText}
              </p>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>

          <aside className="space-y-4">
            <div className="surface-card p-5">
              <h3 className="mb-3 text-sm font-semibold">
                {texts.communities.detail.membersTitle(members.length)}
              </h3>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.userId} className="flex items-center gap-3">
                    <Link to="/perfil/$username" params={{ username: member.username }}>
                      <UserAvatar
                        src={member.avatar}
                        alt={member.name}
                        className="h-9 w-9 shrink-0"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/perfil/$username"
                        params={{ username: member.username }}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {member.name}
                      </Link>
                      {member.role === "ADMIN" && (
                        <Badge
                          variant="outline"
                          className="ml-2 rounded-full text-[10px] px-1.5 py-0"
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

function EditCommunityForm({
  community,
  onClose,
}: {
  community: {
    id: string;
    name: string;
    description: string;
    cover: string | null;
    avatar: string | null;
  };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [cover, setCover] = useState(community.cover ?? "");
  const [avatar, setAvatar] = useState(community.avatar ?? "");
  const coverUpload = useMediaUpload();
  const avatarUpload = useMediaUpload();
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPurpose, setCropPurpose] = useState<CommunityCropPurpose | null>(null);

  const cropConfig = {
    COVER: {
      upload: coverUpload,
      setValue: setCover,
      aspect: 3,
      title: texts.communities.detail.cropCover,
    },
    AVATAR: {
      upload: avatarUpload,
      setValue: setAvatar,
      aspect: 1,
      title: texts.communities.detail.cropAvatar,
    },
  } satisfies Record<
    CommunityCropPurpose,
    {
      upload: ReturnType<typeof useMediaUpload>;
      setValue: React.Dispatch<React.SetStateAction<string>>;
      aspect: number;
      title: string;
    }
  >;

  const resetCrop = useCallback(() => {
    revokeObjectUrl(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      if (!cropPurpose) return;
      const config = cropConfig[cropPurpose];
      const result = await config.upload.upload(
        new File([blob], "crop.jpg", { type: "image/jpeg" }),
        cropPurpose,
      );
      config.setValue(result.cdnUrl);
      resetCrop();
    },
    [cropPurpose, cropConfig, resetCrop],
  );

  const handleFileSelect =
    (purpose: CommunityCropPurpose) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = getFirstFile(event);
      if (!file) return;
      setCropPurpose(purpose);
      setCropImageSrc(createObjectUrl(file));
    };

  const update = useMutation({
    mutationFn: () =>
      communitiesApi.update(
        community.id,
        buildCommunityUpdate(community, { name, description, cover, avatar }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id] });
      onClose();
    },
  });

  const activeCrop = cropPurpose ? cropConfig[cropPurpose] : null;

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.create.name}</Label>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {texts.communities.create.description}
        </Label>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.detail.cover}</Label>
        {cover ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={cover} alt="" className="h-24 w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => coverRef.current?.click()}
              >
                <Camera className="h-4 w-4" /> {texts.communities.detail.change}
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
            <Camera className="h-4 w-4" /> {texts.communities.detail.addCover}
          </Button>
        )}
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
                <Camera className="h-4 w-4" /> {texts.communities.detail.change}
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
            <Camera className="h-4 w-4" /> {texts.communities.detail.addAvatar}
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

      {cropImageSrc && cropPurpose && activeCrop && (
        <ImageCropDialog
          open
          onOpenChange={(value) => {
            if (!value) resetCrop();
          }}
          imageSrc={cropImageSrc}
          aspect={activeCrop.aspect}
          title={activeCrop.title}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
