import type { SubField } from "@/types/components/profile/edit-profile-dialog/sub-field";

export type SubListItemContentProps<T extends Record<"id", string>> = {
  item: T;
  fields: SubField[];
};
