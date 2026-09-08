import type { SubListEmptyStateProps } from "@/types/components/profile/edit-profile-dialog/sub-list-empty-state-props";

export function SubListEmptyState({ message }: SubListEmptyStateProps) {
  return <p className="py-8 text-center text-[13px] font-light text-text-subtle">{message}</p>;
}
