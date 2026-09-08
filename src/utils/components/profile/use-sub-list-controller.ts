import type { ChangeEvent } from "react";

import { texts } from "@/texts";
import type { SubListCollectionProps } from "@/types/components/profile/edit-profile-dialog/sub-list-collection-props";
import type { SubListEditorFormProps } from "@/types/components/profile/edit-profile-dialog/sub-list-editor-form-props";
import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";
import { useSubListEditor } from "@/utils/components/profile/use-sub-list-editor";

export function useSubListController<
  T extends Record<"id", string>,
  TData extends Record<string, unknown> = Record<string, string>,
>(props: SubListProps<T, TData>) {
  const editor = useSubListEditor(props);
  const [primaryField, secondaryField] = props.fields;

  const form: SubListEditorFormProps = {
    fields: props.fields.map((field) => ({
      fieldKey: field.key,
      label: field.label,
      multiline: Boolean(field.multiline),
      type: field.type ?? "text",
      value: editor.form[field.key] ?? "",
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        editor.setFormField(field.key, event.target.value);
      },
    })),
    currentlyHere: props.currentlyHereKey
      ? {
          checked: editor.currentlyHere,
          onCheckedChange: editor.setCurrentlyHere,
        }
      : null,
    actions: {
      saveLabel: editor.isPending ? texts.common.saving : texts.common.save,
      saveDisabled: editor.isPending,
      onSave: editor.submit,
      cancelLabel: texts.common.cancel,
      onCancel: editor.cancel,
    },
  };

  const collection: SubListCollectionProps = {
    items: props.items.map((item) => {
      const values = item as Record<string, unknown>;

      return {
        id: item.id,
        primaryText: String(primaryField ? (values[primaryField.key] ?? "") : ""),
        secondaryText: String(secondaryField ? (values[secondaryField.key] ?? "") : ""),
        onEdit: () => editor.startEdit(item),
        onRemove: () => editor.remove(item.id),
      };
    }),
    emptyMessage: props.emptyMessage,
    onCreate: editor.startCreate,
  };

  return {
    showForm: editor.showForm,
    form,
    collection,
  };
}
