import { type ChangeEvent, useCallback, useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

import {
  ApiError,
  feedApi,
  networkApi,
  profileApi,
  rankingApi,
  recommendationsApi,
  type Profile,
} from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { ProfileMainContent, ProfileSidebar } from "@/components/profile/profile-content";
import { ProfileHeader } from "@/components/profile/profile-header";

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
  component: ProfileRoute,
});

function ProfileRoute() {
  const { user: loaderUser } = Route.useLoaderData();
  const { user: me, requireAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
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
    enabled: !isOwnProfile && Boolean(me),
  });

  const { data: feedData } = useQuery({
    queryKey: ["feed", "user", user.id],
    queryFn: () => feedApi.listByUserId(user.id),
  });

  const { data: rankingData } = useQuery({
    queryKey: ["ranking"],
    queryFn: () => rankingApi.list(10),
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ["recommendations", user.id],
    queryFn: () => recommendationsApi.listReceived(user.id),
  });

  const recommendations = recommendationsData ?? [];
  const recommenderQueries = useQueries({
    queries: recommendations.map((recommendation) => ({
      queryKey: ["profile", "by-id", recommendation.recommenderId],
      queryFn: () => profileApi.getById(recommendation.recommenderId),
      staleTime: 60_000,
    })),
  });

  const recommenders = recommendations.reduce<Record<string, Profile>>(
    (profiles, recommendation, index) => {
      const recommender = recommenderQueries[index]?.data;
      if (recommender) profiles[recommendation.recommenderId] = recommender;
      return profiles;
    },
    {},
  );

  const updateProfile = useMutation({
    mutationFn: (data: { avatar?: string; banner?: string }) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });

  const connect = useMutation({
    mutationFn: () => networkApi.connect(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.code === "CONNECTION_ALREADY_REQUESTED") {
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

  const handleFileSelect =
    (purpose: "AVATAR" | "BANNER") => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setCropImageSrc(URL.createObjectURL(file));
      setCropPurpose(purpose);
    };

  const resetCrop = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  const handleCropComplete = useCallback(
    async (blob: Blob) => {
      if (!cropPurpose) return;
      const upload = cropPurpose === "AVATAR" ? avatarUpload : bannerUpload;
      const field = cropPurpose === "AVATAR" ? "avatar" : "banner";
      const result = await upload.upload(
        new File([blob], "crop.jpg", { type: "image/jpeg" }),
        cropPurpose,
      );
      await updateProfile.mutateAsync({ [field]: result.cdnUrl });
      resetCrop();
    },
    [avatarUpload, bannerUpload, cropPurpose, resetCrop, updateProfile],
  );

  const handleMessage = () => {
    if (!requireAuth()) return;
    navigate({ to: "/mensagens" });
  };

  const handleConnect = () => {
    if (!requireAuth()) return;
    connect.mutate();
  };

  const connectionStatus = connectionData?.status ?? null;
  const connectionLabel =
    connectionStatus === "PENDING"
      ? texts.profile.waitingResponse
      : connectionStatus === "ACCEPTED"
        ? texts.profile.connected
        : texts.profile.connect;
  const connectionDisabled =
    connect.isPending || connectionStatus === "ACCEPTED" || connectionStatus === "PENDING";

  return (
    <AppContainer>
      <div className="space-y-6">
        <ProfileHeader
          user={user}
          isOwnProfile={isOwnProfile}
          avatarUploading={avatarUpload.status === "uploading"}
          bannerUploading={bannerUpload.status === "uploading"}
          connectionLabel={connectionLabel}
          connectionDisabled={connectionDisabled}
          onAvatarSelect={handleFileSelect("AVATAR")}
          onBannerSelect={handleFileSelect("BANNER")}
          onMessage={handleMessage}
          onConnect={handleConnect}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ProfileMainContent user={user} posts={feedData?.items ?? []} />
          <ProfileSidebar
            user={user}
            isOwnProfile={isOwnProfile}
            recommendations={recommendations}
            recommenders={recommenders}
            ranking={rankingData ?? []}
            recommendationOpen={recommendOpen}
            recommendationComment={recommendComment}
            recommendationPending={recommend.isPending}
            onRecommendationOpenChange={setRecommendOpen}
            onRecommendationCommentChange={setRecommendComment}
            onRecommendationSubmit={() => recommend.mutate()}
          />
        </div>
      </div>
      <div className="h-4 lg:hidden" />

      {cropImageSrc && cropPurpose && (
        <ImageCropDialog
          open={Boolean(cropImageSrc)}
          onOpenChange={(open) => {
            if (!open) resetCrop();
          }}
          imageSrc={cropImageSrc}
          aspect={cropPurpose === "AVATAR" ? 1 : 3}
          title={cropPurpose === "AVATAR" ? texts.profile.cropAvatar : texts.profile.cropCover}
          onCropComplete={handleCropComplete}
        />
      )}
    </AppContainer>
  );
}
