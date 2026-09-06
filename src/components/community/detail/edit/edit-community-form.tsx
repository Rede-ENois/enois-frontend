import type { Community } from "@/lib/api";
import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { EditCommunityAvatarField } from "./edit-community-avatar-field";
import { EditCommunityCoverField } from "./edit-community-cover-field";
import { EditCommunityCropDialog } from "./edit-community-crop-dialog";
import { EditCommunityDetailsFields } from "./edit-community-details-fields";
import { useEditCommunityForm } from "./use-edit-community-form";

type EditCommunityFormProps = {
  community: Community;
  onClose: () => void;
};

export function EditCommunityForm({ community, onClose }: EditCommunityFormProps) {
  const formState = useEditCommunityForm(community, onClose);

  return (
    <div className="space-y-4 pt-2">
      <EditCommunityDetailsFields
        name={formState.name}
        description={formState.description}
        onNameChange={formState.setName}
        onDescriptionChange={formState.setDescription}
      />
      <EditCommunityCoverField
        cover={formState.cover}
        inputRef={formState.coverInputRef}
        onSelect={formState.handleFileSelect("COVER")}
        onRemove={() => formState.setCover("")}
      />
      <EditCommunityAvatarField
        avatar={formState.avatar}
        inputRef={formState.avatarInputRef}
        onSelect={formState.handleFileSelect("AVATAR")}
        onRemove={() => formState.setAvatar("")}
      />
      <Button
        className="w-full rounded-full"
        disabled={!formState.name.trim() || formState.isSaving}
        onClick={() => formState.save()}
      >
        {formState.isSaving ? texts.common.saving : texts.common.save}
      </Button>
      <EditCommunityCropDialog
        crop={formState.crop}
        onClose={formState.resetCrop}
        onComplete={formState.handleCropComplete}
      />
    </div>
  );
}
