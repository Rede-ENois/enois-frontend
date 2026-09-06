import type { ProfileEntryField } from "./profile-entry-field";

export type ProfileEntryItemProps<T extends { id: string }> = {
  entry: T;
  fields: ProfileEntryField[];
  onEdit: (entry: T) => void;
  onDelete: (entryId: string) => void;
};
