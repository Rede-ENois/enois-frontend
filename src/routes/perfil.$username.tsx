import { useCallback, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

import {
  Briefcase,
  Camera,
  Clock,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Settings,
  Star,
  Target,
  ThumbsUp,
  Trophy,
} from "lucide-react";

import {
  ApiError,
  feedApi,
  networkApi,
  profileApi,
  rankingApi,
  recommendationsApi,
} from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { AppContainer } from "@/components/app-container";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/perfil/$username")({
  loader: async ({ params }) => {
    try {
      const user = await profileApi.get(params.username);
      return { user };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.user.name ?? texts.profile.seoFallbackTitle} · ${texts.brand.name}`,
      },
      {
        name: "description",
        content: loaderData?.user.headline ?? texts.profile.seoFallbackDescription,
      },
    ],
  }),
  notFoundComponent: () => (
    <AppContainer>
      <div className="rounded-2xl border border-border-soft bg-surface-card p-10 text-center">
        <p className="text-[16px] font-light text-text-strong">{texts.profile.notFound}</p>
        <Link
          to="/"
          className="mt-2 inline-block text-[13px] font-light text-primary hover:underline"
        >
          {texts.profile.backHome}
        </Link>
      </div>
    </AppContainer>
  ),
  errorComponent: () => (
    <AppContainer>
      <div className="rounded-2xl border border-border-soft bg-surface-card p-10 text-center">
        <p className="text-[13px] font-light text-text-subtle">{texts.profile.loadError}</p>
      </div>
    </AppContainer>
  ),
  component: Profile,
});

function Profile() {
  const { user: loaderUser } = Route.useLoaderData();
  const { user: me, requireAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [hoveringAvatar, setHoveringAvatar] = useState(false);
  const [hoveringBanner, setHoveringBanner] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPurpose, setCropPurpose] = useState<"AVATAR" | "BANNER" | null>(null);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendComment, setRecommendComment] = useState("");

  const { data: liveProfile } = useQuery({
    queryKey: ["profile", loaderUser.username],
    queryFn: () => profileApi.get(loaderUser.username),
    initialData: loaderUser,
  });

  const user = liveProfile ?? loaderUser;
  const isOwnProfile = me?.id === user.id;

  const { data: connectionData } = useQuery({
    queryKey: ["connection-status", user.id],
    queryFn: () => networkApi.status(user.id),
    enabled: !isOwnProfile && !!me,
  });

  const connectionStatus = connectionData?.status ?? null;

  const updateProfile = useMutation({
    mutationFn: (data: { avatar?: string; banner?: string }) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });

  const { data: feedData } = useQuery({
    queryKey: ["feed", "user", user.id],
    queryFn: () => feedApi.listByUserId(user.id),
  });

  const userPosts = feedData?.items ?? [];

  const { data: rankingData } = useQuery({
    queryKey: ["ranking"],
    queryFn: () => rankingApi.list(10),
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => recommendationsApi.listReceived(user.id),
  });

  const connect = useMutation({
    mutationFn: () => networkApi.connect(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code === "CONNECTION_ALREADY_REQUESTED") {
        queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
      }
    },
  });

  const recommend = useMutation({
    mutationFn: () => recommendationsApi.create(user.id, { comment: recommendComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
      setRecommendOpen(false);
      setRecommendComment("");
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    setCropImageSrc(src);
    setCropPurpose("AVATAR");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    setCropImageSrc(src);
    setCropPurpose("BANNER");
  };

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      const upload = cropPurpose === "AVATAR" ? avatarUpload : bannerUpload;
      const result = await upload.upload(
        new File([blob], "crop.jpg", { type: "image/jpeg" }),
        cropPurpose!,
      );
      const field = cropPurpose === "AVATAR" ? "avatar" : "banner";
      await updateProfile.mutateAsync({ [field]: result.cdnUrl });
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
      setCropPurpose(null);
    },
    [cropPurpose, cropImageSrc, avatarUpload, bannerUpload, updateProfile],
  );

  const handleCropCancel = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  return (
    <AppContainer>
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-soft bg-surface-card overflow-hidden">
          <div
            className="relative"
            onMouseEnter={() => setHoveringBanner(true)}
            onMouseLeave={() => setHoveringBanner(false)}
          >
            {user.banner ? (
              <img
                src={resolveCdnUrl(user.banner)}
                alt=""
                className="h-40 w-full object-cover sm:h-52"
              />
            ) : (
              <div
                className="h-40 w-full sm:h-52"
                style={{ background: "var(--gradient-primary)" }}
              />
            )}
            {isOwnProfile && hoveringBanner && (
              <button
                type="button"
                onClick={() => bannerRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition"
                disabled={bannerUpload.status === "uploading"}
              >
                {bannerUpload.status === "uploading" ? (
                  texts.common.sending
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </button>
            )}
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
          </div>
          <div className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-3 sm:-mt-14 sm:gap-4">
              <div
                className="relative"
                onMouseEnter={() => setHoveringAvatar(true)}
                onMouseLeave={() => setHoveringAvatar(false)}
              >
                <UserAvatar
                  src={resolveCdnUrl(user.avatar)}
                  alt={user.name}
                  className="h-24 w-24 ring-4 ring-surface-card sm:h-28 sm:w-28"
                />
                {isOwnProfile && hoveringAvatar && (
                  <button
                    type="button"
                    onClick={() => avatarRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-white transition"
                    disabled={avatarUpload.status === "uploading"}
                  >
                    {avatarUpload.status === "uploading" ? "..." : <Camera className="h-5 w-5" />}
                  </button>
                )}
                <input
                  ref={avatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {isOwnProfile ? (
                  <EditProfileDialog profile={user}>
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                      <Settings className="h-4 w-4" /> {texts.profile.editProfile}
                    </Button>
                  </EditProfileDialog>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => {
                        if (!requireAuth()) return;
                        navigate({ to: "/mensagens" });
                      }}
                    >
                      <MessageCircle className="h-4 w-4" /> {texts.profile.message}
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => {
                        if (!requireAuth()) return;
                        connect.mutate();
                      }}
                      disabled={
                        connect.isPending ||
                        connectionStatus === "ACCEPTED" ||
                        connectionStatus === "PENDING"
                      }
                    >
                      {connectionStatus === "PENDING"
                        ? texts.profile.waitingResponse
                        : connectionStatus === "ACCEPTED"
                          ? texts.profile.connected
                          : texts.profile.connect}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-[22px] font-light tracking-tight text-text-strong">
                  {user.name}
                </h1>
                {user.openToWork && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-light text-growth">
                    {texts.profile.openToWork}
                  </span>
                )}
                {user.isMentor && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-light text-primary">
                    {texts.profile.mentorAvailable}
                  </span>
                )}
              </div>
              <p className="mt-1 break-words text-[14px] font-light text-primary">
                {user.headline}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-4 text-[13px] font-light text-text-subtle">
                {user.company && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" /> {user.company}
                  </span>
                )}
                {user.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {user.location}
                  </span>
                )}
                <span>· {texts.profile.connections(user.connectionsCount)}</span>
                {(user.reputation ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-opportunity/15 px-2 py-0.5 text-[11px] font-light text-opportunity-foreground">
                    ★ {texts.profile.reputation(user.reputation ?? 0)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {user.bio && (
              <Section title={texts.profile.sections.about}>
                <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
                  {user.bio}
                </p>
              </Section>
            )}

            {user.skills.length > 0 && (
              <Section title={texts.profile.sections.skills}>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s: string) => (
                    <span
                      key={s}
                      className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-light text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {user.goals.length > 0 && (
              <Section title={texts.profile.sections.goals} icon={Target}>
                <div className="grid gap-3 sm:grid-cols-3">
                  {user.goals.map((goal: string) => (
                    <div key={goal} className="rounded-xl border border-border-soft p-4">
                      <p className="break-words text-[13px] font-light text-text-strong">{goal}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title={texts.profile.sections.recentPosts}>
              {userPosts.length === 0 ? (
                <p className="text-[13px] font-light text-text-subtle">{texts.profile.noPosts}</p>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              )}
            </Section>
          </div>

          <aside className="space-y-6">
            <Section title={texts.profile.sections.availability} icon={Clock}>
              <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
                {user.availability ?? texts.profile.availabilityUnknown}
              </p>
            </Section>

            {!isOwnProfile && (
              <Section title={texts.profile.sections.recommend} icon={ThumbsUp}>
                <p className="mb-3 text-[13px] font-light text-text-subtle">
                  {texts.profile.recommendDescription}
                </p>
                <Dialog open={recommendOpen} onOpenChange={setRecommendOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full rounded-full gap-1.5">
                      <ThumbsUp className="h-4 w-4" /> {texts.profile.recommendAction}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-light">
                        {texts.profile.recommendTitle(user.name)}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <Textarea
                        value={recommendComment}
                        onChange={(e) => setRecommendComment(e.target.value)}
                        placeholder={texts.profile.recommendPlaceholder}
                        rows={3}
                        className="border-border-soft bg-surface-1 text-[13px] font-light"
                      />
                      <Button
                        size="sm"
                        className="w-full rounded-full"
                        disabled={!recommendComment.trim() || recommend.isPending}
                        onClick={() => recommend.mutate()}
                      >
                        {recommend.isPending
                          ? texts.common.sending
                          : texts.profile.sendRecommendation}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </Section>
            )}

            {recommendationsData && recommendationsData.length > 0 && (
              <Section title={texts.profile.sections.recommendations} icon={Star}>
                <div className="space-y-3">
                  {recommendationsData.map((rec) => (
                    <RecommendationItem key={rec.id} recommendation={rec} />
                  ))}
                </div>
              </Section>
            )}

            {rankingData && rankingData.length > 0 && (
              <Section title={texts.profile.sections.ranking} icon={Trophy}>
                <div className="space-y-2">
                  {rankingData.slice(0, 5).map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <span
                        className={`w-5 text-center text-[13px] font-light ${
                          i < 3 ? "text-opportunity" : "text-text-subtle"
                        }`}
                      >
                        {i + 1}º
                      </span>
                      <Link to="/perfil/$username" params={{ username: u.username }}>
                        <UserAvatar src={u.avatar} alt={u.name} className="h-8 w-8 shrink-0" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/perfil/$username"
                          params={{ username: u.username }}
                          className="truncate text-[13px] font-light text-text-strong hover:underline"
                        >
                          {u.name}
                        </Link>
                      </div>
                      <span className="text-[11px] font-light text-opportunity-foreground">
                        {u.reputation}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {user.externalLinks.length > 0 && (
              <Section title={texts.profile.sections.links}>
                <ul className="space-y-2 text-[13px] font-light">
                  {user.externalLinks.map((link: string) => (
                    <li key={link} className="flex items-center gap-2 text-text-subtle">
                      <LinkIcon className="h-4 w-4" />
                      <span className="truncate text-text-strong">{link}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </aside>
        </div>
      </div>
      <div className="h-4 lg:hidden" />

      {cropImageSrc && cropPurpose && (
        <ImageCropDialog
          open={!!cropImageSrc}
          onOpenChange={(v) => {
            if (!v) handleCropCancel();
          }}
          imageSrc={cropImageSrc}
          aspect={cropPurpose === "AVATAR" ? 1 : 3}
          title={
            cropPurpose === "AVATAR" ? texts.profile.cropAvatar : texts.profile.cropCover
          }
          onCropComplete={handleCropComplete}
        />
      )}
    </AppContainer>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-light text-text-strong">
        {Icon && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-2">
            <Icon className="h-4 w-4 text-primary" />
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

function RecommendationItem({
  recommendation,
}: {
  recommendation: { recommenderId: string; comment: string };
}) {
  const { data: recommender } = useQuery({
    queryKey: ["profile", "by-id", recommendation.recommenderId],
    queryFn: () => profileApi.getById(recommendation.recommenderId),
  });

  return (
    <div className="rounded-xl bg-surface-1 p-3">
      <div className="flex items-center gap-2 mb-2">
        <UserAvatar src={recommender?.avatar} alt={recommender?.name} className="h-6 w-6" />
        <span className="text-[12px] font-medium text-text-strong">
          {recommender?.name ?? texts.profile.userFallback}
        </span>
      </div>
      <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
        "{recommendation.comment}"
      </p>
    </div>
  );
}
