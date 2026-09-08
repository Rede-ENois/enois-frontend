import type { SubField } from "@/types/components/profile/edit-profile-dialog/sub-field";

export type SubListCollectionProps<T extends Record<"id", string>> = {
  items: T[];
  fields: SubField[];
  emptyMessage: string;
  onEdit: (item: T) => void;
  onRemove: (id: string) => void;
  onCreate: () => void;
};
