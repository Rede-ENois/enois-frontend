import { texts } from "@/texts";
import type { CommunityImageFieldProps } from "@/types/components/communities/community-image-field-props";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { CommunityImageActions } from "@/components/community-image-actions";

export function CommunityImageField({
  purpose,
  value,
  inputRef,
  onChange,
  onRemove,
}: CommunityImageFieldProps) {
  const isCover = purpose === "COVER";
  const label = isCover ? texts.communities.detail.cover : texts.communities.detail.avatar;
  const addLabel = isCover ? texts.communities.detail.addCover : texts.communities.detail.addAvatar;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {value ? (
        isCover ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={value} alt="" className="h-24 w-full object-cover" />

            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition hover:opacity-100">
              <CommunityImageActions inputRef={inputRef} onRemove={onRemove} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={value}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
            />

            <div className="flex gap-2">
              <CommunityImageActions inputRef={inputRef} onRemove={onRemove} />
            </div>
          </div>
        )
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full gap-1.5"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />

          <>{addLabel}</>
        </Button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </div>
  );
}
