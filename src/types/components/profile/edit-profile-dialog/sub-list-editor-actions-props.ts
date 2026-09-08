export type SubListEditorActionsProps = {
  isPending: boolean;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
};
