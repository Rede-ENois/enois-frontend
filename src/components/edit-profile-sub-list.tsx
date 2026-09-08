import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";

import { useSubListEditor } from "@/utils/components/profile/use-sub-list-editor";

import { SubListCollection } from "@/components/sub-list-collection";
import { SubListEditorForm } from "@/components/sub-list-editor-form";

export function SubList<
  T extends Record<"id", string>,
  TData extends Record<string, unknown> = Record<string, string>,
>(props: SubListProps<T, TData>) {
  const editor = useSubListEditor(props);

  return (
    <div className="space-y-4">
      {editor.showForm ? (
        <SubListEditorForm
          fields={props.fields}
          form={editor.form}
          showCurrentlyHere={Boolean(props.currentlyHereKey)}
          currentlyHere={editor.currentlyHere}
          onCurrentlyHereChange={editor.setCurrentlyHere}
          onFieldChange={editor.setFormField}
          isPending={editor.isPending}
          onSubmit={editor.submit}
          onCancel={editor.cancel}
        />
      ) : (
        <SubListCollection
          items={props.items}
          fields={props.fields}
          emptyMessage={props.emptyMessage}
          onEdit={editor.startEdit}
          onRemove={editor.remove}
          onCreate={editor.startCreate}
        />
      )}
    </div>
  );
}
