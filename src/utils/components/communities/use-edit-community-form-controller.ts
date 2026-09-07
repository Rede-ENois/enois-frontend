import type { EditCommunityFormProps } from "@/types/components/communities/edit-community-form-props";

import { useEditCommunityFormState } from "@/utils/components/communities/use-edit-community-form-state";
import { useEditCommunityImages } from "@/utils/components/communities/use-edit-community-images";
import { useUpdateCommunityController } from "@/utils/components/communities/use-update-community-controller";

export function useEditCommunityFormController({ community, onClose }: EditCommunityFormProps) {
  const formState = useEditCommunityFormState(community);
  const images = useEditCommunityImages(formState.form, formState.setField);
  const update = useUpdateCommunityController(community, formState.form, onClose);

  return {
    form: formState.form,
    setField: formState.setField,
    ...images,
    savePending: update.pending,
    saveDisabled: !formState.form.name.trim() || update.pending,
    save: update.save,
  };
}
