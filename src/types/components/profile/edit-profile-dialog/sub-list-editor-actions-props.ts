export type SubListEditorActionsProps = {
  saveLabel: string;
  saveDisabled: boolean;
  onSave: () => void | Promise<void>;
  cancelLabel: string;
  onCancel: () => void;
};
