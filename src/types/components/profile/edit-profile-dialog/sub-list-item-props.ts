import type { SubField } from "@/types/components/profile/edit-profile-dialog/sub-field";

export type SubListItemProps<T extends Record<"id", string>> = {
  item: T;
  fields: SubField[];
  onEdit: (item: T) => void;
  onRemove: (id: string) => void;
};
