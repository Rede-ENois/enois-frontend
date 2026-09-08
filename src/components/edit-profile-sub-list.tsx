import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";
import { useSubListController } from "@/utils/components/profile/use-sub-list-controller";

import { SubListCollection } from "@/components/sub-list-collection";
import { SubListEditorForm } from "@/components/sub-list-editor-form";

export function SubList<
  T extends Record<"id", string>,
  TData extends Record<string, unknown> = Record<string, string>,
>(props: SubListProps<T, TData>) {
  const controller = useSubListController(props);

  return (
    <div className="space-y-4">
      {controller.showForm ? (
        <SubListEditorForm {...controller.form} />
      ) : (
        <SubListCollection {...controller.collection} />
      )}
    </div>
  );
}
