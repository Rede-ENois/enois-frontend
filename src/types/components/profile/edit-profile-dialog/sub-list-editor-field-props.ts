import type { SubField } from "@/types/components/profile/edit-profile-dialog/sub-field";

export type SubListEditorFieldProps = {
  field: SubField;
  value: string;
  onChange: (value: string) => void;
};
