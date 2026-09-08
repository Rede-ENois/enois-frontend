import type { SubListItemContentProps } from "@/types/components/profile/edit-profile-dialog/sub-list-item-content-props";

export function SubListItemContent({ primaryText, secondaryText }: SubListItemContentProps) {
  return (
    <div className="min-w-0 flex-1 text-[13px] font-light">
      <p className="break-words text-text-strong">{primaryText}</p>

      <p className="break-words text-text-subtle">{secondaryText}</p>
    </div>
  );
}
