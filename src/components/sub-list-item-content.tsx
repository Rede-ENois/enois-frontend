import type { SubListItemContentProps } from "@/types/components/profile/edit-profile-dialog/sub-list-item-content-props";

export function SubListItemContent<T extends Record<"id", string>>({
  item,
  fields,
}: SubListItemContentProps<T>) {
  const values = item as Record<string, unknown>;
  const [primaryField, secondaryField] = fields;

  return (
    <div className="min-w-0 flex-1 text-[13px] font-light">
      <p className="break-words text-text-strong">
        {String(primaryField ? (values[primaryField.key] ?? "") : "")}
      </p>
      <p className="break-words text-text-subtle">
        {String(secondaryField ? (values[secondaryField.key] ?? "") : "")}
      </p>
    </div>
  );
}
