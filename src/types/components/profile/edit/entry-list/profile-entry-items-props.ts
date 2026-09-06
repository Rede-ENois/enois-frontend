import type { ProfileEntryField } from "./profile-entry-field";

export type ProfileEntryItemsProps<T extends { id: string }> = {
  entries: T[];
  fields: ProfileEntryField[];
  emptyMessage: string;
  onEdit: (entry: T) => void;
  onDelete: (entryId: string) => void;
  onAdd: () => void;
};
