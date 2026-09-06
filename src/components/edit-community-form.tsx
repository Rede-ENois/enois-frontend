import { type ChangeEvent, useCallback, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Camera } from "lucide-react";

import { communitiesApi } from "@/lib/api/communities";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import type { CommunityCropPurpose } from "@/types/components/communities/community-crop-purpose";
import type { EditCommunityFormProps } from "@/types/components/communities/edit-community-form-props";

import { ImageCropDialog } from "@/components/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EditCommunityForm({ community, onClose }: EditCommunityFormProps) {
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
    [avatarUpload, coverUpload, cropImageSrc, cropPurpose],
  );

  const handleCropCancel = useCallback(() => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropPurpose(null);
  }, [cropImageSrc]);

  const handleFileSelect =
    (field: CommunityCropPurpose) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setCropPurpose(field);
      setCropImageSrc(URL.createObjectURL(file));
    };

  const update = useMutation({
    mutationFn: () =>
      communitiesApi.update(community.id, {
        name: name !== community.name ? name : undefined,
        description: description !== community.description ? description : undefined,
        cover: cover || null,
        avatar: avatar || null,
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
                <Camera className="h-4 w-4" /><>{texts.communities.detail.change}</>
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
            <Camera className="h-4 w-4" /><>{texts.communities.detail.addCover}</>
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
                <Camera className="h-4 w-4" /><>{texts.communities.detail.change}</>
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
            <Camera className="h-4 w-4" /><>{texts.communities.detail.addAvatar}</>
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
          onOpenChange={(open) => {
            if (!open) handleCropCancel();
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
