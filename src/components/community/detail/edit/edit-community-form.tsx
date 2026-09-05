import type { Community } from "@/lib/api";
import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { EditCommunityAvatarField } from "./edit-community-avatar-field";
import { EditCommunityCoverField } from "./edit-community-cover-field";
import { EditCommunityCropDialog } from "./edit-community-crop-dialog";
import { EditCommunityDetailsFields } from "./edit-community-details-fields";
import { useEditCommunityForm } from "./use-edit-community-form";

export function EditCommunityForm({ community, onClose }: { community: Community; onClose: () => void }) {
  const state = useEditCommunityForm(community, onClose);

  return (
    <div className="space-y-4 pt-2">
      <EditCommunityDetailsFields
        name={state.name}
        description={state.description}
        onNameChange={state.setName}
        onDescriptionChange={state.setDescription}
      />
      <EditCommunityCoverField
        cover={state.cover}
        inputRef={state.coverRef}
        onSelect={state.handleFileSelect("COVER")}
        onRemove={() => state.setCover("")}
      />
      <EditCommunityAvatarField
        avatar={state.avatar}
        inputRef={state.avatarRef}
        onSelect={state.handleFileSelect("AVATAR")}
        onRemove={() => state.setAvatar("")}
      />
      <Button className="w-full rounded-full" disabled={!state.name.trim() || state.saving} onClick={() => state.save()}>
        {state.saving ? texts.common.saving : texts.common.save}
      </Button>
      <EditCommunityCropDialog crop={state.crop} onClose={state.resetCrop} onComplete={state.handleCropComplete} />
    </div>
  );
}
