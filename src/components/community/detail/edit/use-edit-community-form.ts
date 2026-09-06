import { type ChangeEvent, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { communityApi, type Community } from "@/lib/api";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import { buildCommunityUpdate, type CommunityCropPurpose } from "@/utils/community";
import { createObjectUrl, getFirstFile, revokeObjectUrl } from "@/utils/files";

export function useEditCommunityForm(community: Community, onClose: () => void) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [cover, setCover] = useState(community.cover ?? "");
  const [avatar, setAvatar] = useState(community.avatar ?? "");
  const coverUpload = useMediaUpload();
  const avatarUpload = useMediaUpload();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPurpose, setCropPurpose] = useState<CommunityCropPurpose | null>(null);

  const cropConfig = {
    COVER: { upload: coverUpload, setValue: setCover, aspect: 3, title: texts.communities.detail.cropCover },
    AVATAR: { upload: avatarUpload, setValue: setAvatar, aspect: 1, title: texts.communities.detail.cropAvatar },
  } as const;

  const resetCrop = () => {
    revokeObjectUrl(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!cropPurpose) return;
    const activeCropConfig = cropConfig[cropPurpose];
    const uploadResult = await activeCropConfig.upload.upload(
      new File([blob], "crop.jpg", { type: "image/jpeg" }),
      cropPurpose,
    );
    activeCropConfig.setValue(uploadResult.cdnUrl);
    resetCrop();
  };

  const handleFileSelect = (purpose: CommunityCropPurpose) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = getFirstFile(event);
      if (!file) return;
      setCropPurpose(purpose);
      setCropImageSrc(createObjectUrl(file));
    };

  const updateCommunityMutation = useMutation({
    mutationFn: () => communityApi.update(
      community.id,
      buildCommunityUpdate(community, { name, description, cover, avatar }),
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id] });
      onClose();
    },
  });

  const activeCropConfig = cropPurpose ? cropConfig[cropPurpose] : null;

  return {
    name,
    setName,
    description,
    setDescription,
    cover,
    setCover,
    avatar,
    setAvatar,
    coverInputRef,
    avatarInputRef,
    handleFileSelect,
    isSaving: updateCommunityMutation.isPending,
    save: updateCommunityMutation.mutate,
    crop: cropImageSrc && activeCropConfig
      ? {
          imageSrc: cropImageSrc,
          aspect: activeCropConfig.aspect,
          title: activeCropConfig.title,
        }
      : null,
    resetCrop,
    handleCropComplete,
  };
}
