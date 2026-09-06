import { type ChangeEvent, useCallback, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import {
  ApiError,
  networkApi,
  profileApi,
  recommendationApi,
  type Profile,
} from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";

export function useProfilePageActions(user: Profile, connectionStatus: string | null) {
  const { requireAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const avatarUpload = useMediaUpload();
  const bannerUpload = useMediaUpload();
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPurpose, setCropPurpose] = useState<"AVATAR" | "BANNER" | null>(null);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [recommendationComment, setRecommendationComment] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: (input: { avatar?: string; banner?: string }) => profileApi.updateCurrent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });
  const sendConnectionRequestMutation = useMutation({
    mutationFn: () => networkApi.sendConnectionRequest(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] }),
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.code === "CONNECTION_ALREADY_REQUESTED") {
        queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] });
      }
    },
  });
  const createRecommendationMutation = useMutation({
    mutationFn: () => recommendationApi.create(user.id, { comment: recommendationComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
      setIsRecommendationOpen(false);
      setRecommendationComment("");
    },
  });

  const resetCrop = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  const handleCropComplete = useCallback(async (blob: Blob) => {
    if (!cropPurpose) return;
    const upload = cropPurpose === "AVATAR" ? avatarUpload : bannerUpload;
    const field = cropPurpose === "AVATAR" ? "avatar" : "banner";
    const uploadResult = await upload.upload(
      new File([blob], "crop.jpg", { type: "image/jpeg" }),
      cropPurpose,
    );
    await updateProfileMutation.mutateAsync({ [field]: uploadResult.cdnUrl });
    resetCrop();
  }, [avatarUpload, bannerUpload, cropPurpose, resetCrop, updateProfileMutation]);

  const handleFileSelect = (purpose: "AVATAR" | "BANNER") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setCropImageSrc(URL.createObjectURL(file));
      setCropPurpose(purpose);
    };

  return {
    isAvatarUploading: avatarUpload.status === "uploading",
    isBannerUploading: bannerUpload.status === "uploading",
    connectionLabel:
      connectionStatus === "PENDING"
        ? texts.profile.waitingResponse
        : connectionStatus === "ACCEPTED"
          ? texts.profile.connected
          : texts.profile.connect,
    isConnectionDisabled:
      sendConnectionRequestMutation.isPending ||
      connectionStatus === "ACCEPTED" ||
      connectionStatus === "PENDING",
    cropImageSrc,
    cropPurpose,
    isRecommendationOpen,
    recommendationComment,
    isRecommendationPending: createRecommendationMutation.isPending,
    setIsRecommendationOpen,
    setRecommendationComment,
    resetCrop,
    handleCropComplete,
    handleAvatarSelect: handleFileSelect("AVATAR"),
    handleBannerSelect: handleFileSelect("BANNER"),
    handleMessage: () => requireAuth() && navigate({ to: "/mensagens" }),
    handleConnect: () => {
      if (requireAuth()) sendConnectionRequestMutation.mutate();
    },
    handleRecommendationSubmit: () => createRecommendationMutation.mutate(),
  };
}
