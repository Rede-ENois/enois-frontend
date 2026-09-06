import { texts } from "@/texts";
import type { EditCommunityDetailsFieldsProps } from "@/types/components/community/edit-community-details-fields-props";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EditCommunityDetailsFields({ name, description, onNameChange, onDescriptionChange }: EditCommunityDetailsFieldsProps) {
  return <><div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{texts.communities.create.name}</Label><Input value={name} onChange={(event) => onNameChange(event.target.value)} /></div><div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{texts.communities.create.description}</Label><Textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} rows={3} /></div></>;
}
