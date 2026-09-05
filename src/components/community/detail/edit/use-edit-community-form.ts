import { type ChangeEvent, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { communitiesApi, type Community } from "@/lib/api";
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
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
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
    const config = cropConfig[cropPurpose];
    const result = await config.upload.upload(new File([blob], "crop.jpg", { type: "image/jpeg" }), cropPurpose);
    config.setValue(result.cdnUrl);
    resetCrop();
  };

  const handleFileSelect = (purpose: CommunityCropPurpose) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = getFirstFile(event);
    if (!file) return;
    setCropPurpose(purpose);
    setCropImageSrc(createObjectUrl(file));
  };

  const update = useMutation({
    mutationFn: () => communitiesApi.update(
      community.id,
      buildCommunityUpdate(community, { name, description, cover, avatar }),
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id] });
      onClose();
    },
  });

  const activeCrop = cropPurpose ? cropConfig[cropPurpose] : null;

  return {
    name, setName, description, setDescription, cover, setCover, avatar, setAvatar,
    coverRef, avatarRef, handleFileSelect,
    saving: update.isPending,
    save: update.mutate,
    crop: cropImageSrc && activeCrop ? { imageSrc: cropImageSrc, aspect: activeCrop.aspect, title: activeCrop.title } : null,
    resetCrop,
    handleCropComplete,
  };
}
