import type { SubListCurrentlyHereToggleProps } from "@/types/components/profile/edit-profile-dialog/sub-list-currently-here-toggle-props";
import type { SubListEditorActionsProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-actions-props";
import type { SubListEditorFieldProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-field-props";

export type SubListEditorFormProps = {
  fields: SubListEditorFieldProps[];
  currentlyHere: SubListCurrentlyHereToggleProps | null;
  actions: SubListEditorActionsProps;
};
