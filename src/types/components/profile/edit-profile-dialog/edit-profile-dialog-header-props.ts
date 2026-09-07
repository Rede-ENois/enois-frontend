export type EditProfileDialogHeaderProps = {
  tabs: {
    key: string;
    label: string;
    selected: boolean;
    select: () => void;
  }[];
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
};
