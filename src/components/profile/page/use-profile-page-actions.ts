import { type ChangeEvent, useCallback, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { ApiError, networkApi, profileApi, recommendationsApi, type Profile } from "@/lib/api";
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
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendComment, setRecommendComment] = useState("");

  const updateProfile = useMutation({
    mutationFn: (data: { avatar?: string; banner?: string }) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });
  const connect = useMutation({
    mutationFn: () => networkApi.connect(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connection-status", user.id] }),
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

  const resetCrop = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);
  const handleCropComplete = useCallback(async (blob: Blob) => {
    if (!cropPurpose) return;
    const upload = cropPurpose === "AVATAR" ? avatarUpload : bannerUpload;
    const field = cropPurpose === "AVATAR" ? "avatar" : "banner";
    const result = await upload.upload(new File([blob], "crop.jpg", { type: "image/jpeg" }), cropPurpose);
    await updateProfile.mutateAsync({ [field]: result.cdnUrl });
    resetCrop();
  }, [avatarUpload, bannerUpload, cropPurpose, resetCrop, updateProfile]);
  const handleFileSelect = (purpose: "AVATAR" | "BANNER") => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCropPurpose(purpose);
  };

  return {
    avatarUploading: avatarUpload.status === "uploading",
    bannerUploading: bannerUpload.status === "uploading",
    connectionLabel: connectionStatus === "PENDING" ? texts.profile.waitingResponse : connectionStatus === "ACCEPTED" ? texts.profile.connected : texts.profile.connect,
    connectionDisabled: connect.isPending || connectionStatus === "ACCEPTED" || connectionStatus === "PENDING",
    cropImageSrc,
    cropPurpose,
    recommendOpen,
    recommendComment,
    recommendationPending: recommend.isPending,
    setRecommendOpen,
    setRecommendComment,
    resetCrop,
    handleCropComplete,
    handleAvatarSelect: handleFileSelect("AVATAR"),
    handleBannerSelect: handleFileSelect("BANNER"),
    handleMessage: () => requireAuth() && navigate({ to: "/mensagens" }),
    handleConnect: () => { if (requireAuth()) connect.mutate(); },
    submitRecommendation: () => recommend.mutate(),
  };
}
