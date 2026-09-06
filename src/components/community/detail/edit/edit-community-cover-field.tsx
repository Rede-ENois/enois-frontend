import { Camera } from "lucide-react";

import { texts } from "@/texts";
import type { EditCommunityCoverFieldProps } from "@/types/components/community/edit-community-cover-field-props";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function EditCommunityCoverField({ cover, inputRef, onSelect, onRemove }: EditCommunityCoverFieldProps) {
  return (
    <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{texts.communities.detail.cover}</Label>{cover ? <div className="relative overflow-hidden rounded-xl border border-border"><img src={cover} alt="" className="h-24 w-full object-cover" /><div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition hover:opacity-100"><Button type="button" variant="secondary" size="sm" className="rounded-full gap-1.5" onClick={() => inputRef.current?.click()}><Camera className="h-4 w-4" /> {texts.communities.detail.change}</Button><Button type="button" variant="destructive" size="sm" className="rounded-full" onClick={onRemove}>{texts.communities.detail.remove}</Button></div></div> : <Button type="button" variant="outline" className="w-full rounded-full gap-1.5" onClick={() => inputRef.current?.click()}><Camera className="h-4 w-4" /> {texts.communities.detail.addCover}</Button>}<input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelect} /></div>
  );
}
