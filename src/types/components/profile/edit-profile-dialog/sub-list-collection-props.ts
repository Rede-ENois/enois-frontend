import type { SubListItemProps } from "@/types/components/profile/edit-profile-dialog/sub-list-item-props";

export type SubListCollectionProps = {
  items: SubListItemProps[];
  emptyMessage: string;
  onCreate: () => void;
};
