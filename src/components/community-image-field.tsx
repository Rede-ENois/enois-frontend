import type { CommunityImageFieldProps } from "@/types/components/communities/community-image-field-props";

import { createCommunityImageFieldViewModel } from "@/utils/components/communities/create-community-image-field-view-model";

import { Label } from "@/components/ui/label";

import { CommunityAvatarPreview } from "@/components/community-avatar-preview";
import { CommunityCoverPreview } from "@/components/community-cover-preview";
import { CommunityImageAddAction } from "@/components/community-image-add-action";
import { CommunityImageInput } from "@/components/community-image-input";

export function CommunityImageField(props: CommunityImageFieldProps) {
  const { value, inputRef, onChange, onRemove } = props;
  const view = createCommunityImageFieldViewModel(props);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{view.label}</Label>

      {view.showCoverPreview && (
        <CommunityCoverPreview value={value} inputRef={inputRef} onRemove={onRemove} />
      )}
      {view.showAvatarPreview && (
        <CommunityAvatarPreview value={value} inputRef={inputRef} onRemove={onRemove} />
      )}
      {view.showAddAction && (
        <CommunityImageAddAction label={view.addLabel} onClick={view.openFilePicker} />
      )}

      <CommunityImageInput inputRef={inputRef} onChange={onChange} />
    </div>
  );
}
