import { useState } from "react";

import type { SubField } from "@/types/components/profile/edit-profile-dialog/sub-field";
import { createSubListFormValues } from "@/utils/components/profile/create-sub-list-form-values";

export function useSubListEditorState<T extends Record<"id", string>>(
  fields: SubField[],
  currentlyHereKey: string | undefined,
  newItem: Record<string, string>,
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...newItem });
  const [currentlyHere, setCurrentlyHere] = useState(false);

  const reset = () => {
    setEditingId(null);
    setForm({ ...newItem });
    setCurrentlyHere(false);
  };

  return {
    editingId,
    form,
    currentlyHere,
    setCurrentlyHere,
    setFormField: (key: string, value: string) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    startEdit: (item: T) => {
      setEditingId(item.id);
      setForm(createSubListFormValues(item, fields));
      setCurrentlyHere(
        currentlyHereKey ? Boolean((item as Record<string, unknown>)[currentlyHereKey]) : false,
      );
    },
    startCreate: () => {
      setEditingId("__new__");
      setForm({ ...newItem });
      setCurrentlyHere(false);
    },
    reset,
  };
}
