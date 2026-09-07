import { Camera } from "lucide-react";

import { useEditCommunityFormController } from "@/lib/use-edit-community-form-controller";
import { texts } from "@/texts";
import type { EditCommunityFormProps } from "@/types/components/communities/edit-community-form-props";

import { ImageCropDialog } from "@/components/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EditCommunityForm(props: EditCommunityFormProps) {
  const { form, setField, coverRef, avatarRef, crop, savePending, save } =
    useEditCommunityFormController(props);

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.create.name}</Label>
        <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {texts.communities.create.description}
        </Label>
        <Textarea
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.detail.cover}</Label>
        {form.cover ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={form.cover} alt="" className="h-24 w-full object-cover" />
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
                onClick={() => setField("cover", "")}
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
          onChange={crop.handleFileSelect("COVER")}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.detail.avatar}</Label>
        {form.avatar ? (
          <div className="flex items-center gap-3">
            <img
              src={form.avatar}
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
                onClick={() => setField("avatar", "")}
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
          onChange={crop.handleFileSelect("AVATAR")}
        />
      </div>
      <Button className="w-full rounded-full" disabled={!form.name.trim() || savePending} onClick={save}>
        {savePending ? texts.common.saving : texts.common.save}
      </Button>

      {crop.cropImageSrc && crop.cropPurpose && (
        <ImageCropDialog
          open={!!crop.cropImageSrc}
          onOpenChange={(open) => {
            if (!open) crop.handleCropCancel();
          }}
          imageSrc={crop.cropImageSrc}
          aspect={crop.cropPurpose === "COVER" ? 3 : 1}
          title={
            crop.cropPurpose === "COVER"
              ? texts.communities.detail.cropCover
              : texts.communities.detail.cropAvatar
          }
          onCropComplete={crop.handleCropComplete}
        />
      )}
    </div>
  );
}
