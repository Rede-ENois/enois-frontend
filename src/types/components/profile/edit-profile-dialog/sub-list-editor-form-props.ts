import type { SubField } from "@/types/components/profile/edit-profile-dialog/sub-field";

export type SubListEditorFormProps = {
  fields: SubField[];
  form: Record<string, string>;
  showCurrentlyHere: boolean;
  currentlyHere: boolean;
  onCurrentlyHereChange: (checked: boolean) => void;
  onFieldChange: (key: string, value: string) => void;
  isPending: boolean;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
};
