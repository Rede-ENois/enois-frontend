import { useCallback, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { CommunityCropPurpose } from "@/types/components/communities/community-crop-purpose";
import type { EditCommunityFormProps } from "@/types/components/communities/edit-community-form-props";

import { updateCommunity as updateCommunityRequest } from "@/lib/api/communities/update-community";
import { useImageCropUpload } from "@/lib/use-image-crop-upload";
import { useMediaUpload } from "@/lib/use-media-upload";

export function useEditCommunityFormController({ community, onClose }: EditCommunityFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: community.name,
    description: community.description,
    cover: community.cover ?? "",
    avatar: community.avatar ?? "",
  });
  const coverUpload = useMediaUpload();
  const avatarUpload = useMediaUpload();
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const uploadCrop = useCallback(
    (purpose: CommunityCropPurpose, file: File) =>
      (purpose === "COVER" ? coverUpload : avatarUpload).upload(file, purpose),
    [avatarUpload, coverUpload],
  );

  const applyUpload = useCallback((purpose: CommunityCropPurpose, cdnUrl: string) => {
    const field = purpose === "COVER" ? "cover" : "avatar";
    setForm((current) => ({ ...current, [field]: cdnUrl }));
  }, []);

  const crop = useImageCropUpload(uploadCrop, applyUpload);

  const update = useMutation({
    mutationFn: () =>
      updateCommunityRequest(community.id, {
        name: form.name !== community.name ? form.name : undefined,
        description: form.description !== community.description ? form.description : undefined,
        cover: form.cover || null,
        avatar: form.avatar || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id] });
      onClose();
    },
  });

  const setField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const coverField = {
    purpose: "COVER" as const,
    value: form.cover,
    inputRef: coverRef,
    onChange: crop.handleFileSelect("COVER"),
    onRemove: () => setField("cover", ""),
  };
  const avatarField = {
    purpose: "AVATAR" as const,
    value: form.avatar,
    inputRef: avatarRef,
    onChange: crop.handleFileSelect("AVATAR"),
    onRemove: () => setField("avatar", ""),
  };
  const cropDialog =
    crop.cropImageSrc && crop.cropPurpose
      ? {
          open: true,
          onOpenChange: (open: boolean) => {
            if (!open) crop.handleCropCancel();
          },
          imageSrc: crop.cropImageSrc,
          aspect: crop.cropPurpose === "COVER" ? 3 : 1,
          title:
            crop.cropPurpose === "COVER"
              ? texts.communities.detail.cropCover
              : texts.communities.detail.cropAvatar,
          onCropComplete: crop.handleCropComplete,
        }
      : null;

  return {
    form,
    setField,
    coverField,
    avatarField,
    cropDialog,
    savePending: update.isPending,
    saveDisabled: !form.name.trim() || update.isPending,
    save: () => update.mutate(),
  };
}
