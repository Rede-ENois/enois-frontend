import type { ProfileEntryField } from "./profile-entry-field";

export type ProfileEntryFormProps = {
  fields: ProfileEntryField[];
  formValues: Record<string, string>;
  currentlyHereKey?: string;
  isCurrentlyHere: boolean;
  isPending: boolean;
  onFieldChange: (key: string, value: string) => void;
  onCurrentlyHereChange: (value: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
};
