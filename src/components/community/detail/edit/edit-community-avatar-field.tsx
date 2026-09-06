import { Camera } from "lucide-react";

import { texts } from "@/texts";
import type { EditCommunityAvatarFieldProps } from "@/types/components/community/edit-community-avatar-field-props";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function EditCommunityAvatarField({ avatar, inputRef, onSelect, onRemove }: EditCommunityAvatarFieldProps) {
  return (
    <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{texts.communities.detail.avatar}</Label>{avatar ? <div className="flex items-center gap-3"><img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-border" /><div className="flex gap-2"><Button type="button" variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => inputRef.current?.click()}><Camera className="h-4 w-4" /> {texts.communities.detail.change}</Button><Button type="button" variant="destructive" size="sm" className="rounded-full" onClick={onRemove}>{texts.communities.detail.remove}</Button></div></div> : <Button type="button" variant="outline" className="w-full rounded-full gap-1.5" onClick={() => inputRef.current?.click()}><Camera className="h-4 w-4" /> {texts.communities.detail.addAvatar}</Button>}<input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelect} /></div>
  );
}
