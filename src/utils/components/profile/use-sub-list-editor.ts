import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";
import type { SubListUpdate } from "@/types/components/profile/edit-profile-dialog/sub-list-update";

export function useSubListEditor<
  T extends Record<"id", string>,
  TData extends Record<string, unknown> = Record<string, string>,
>({
  fields,
  currentlyHereKey,
  createApi,
  updateApi,
  deleteApi,
  queryKey,
  newItem,
}: SubListProps<T, TData>) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...newItem });
  const [currentlyHere, setCurrentlyHere] = useState(false);

  const resetEditor = () => {
    setEditingId(null);
    setForm({ ...newItem });
    setCurrentlyHere(false);
  };

  const create = useMutation({
    mutationFn: (data: TData) => createApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      resetEditor();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: SubListUpdate<TData>) => updateApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      resetEditor();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const startEdit = (item: T) => {
    setEditingId(item.id);
    const values: Record<string, string> = {};
    for (const field of fields) {
      values[field.key] = String((item as Record<string, unknown>)[field.key] ?? "");
    }
    setForm(values);
    if (currentlyHereKey) {
      setCurrentlyHere(Boolean((item as Record<string, unknown>)[currentlyHereKey]));
    }
  };

  const startCreate = () => {
    setEditingId("__new__");
    setForm({ ...newItem });
    setCurrentlyHere(false);
  };

  const setFormField = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    const data: Record<string, unknown> = { ...form };
    if (currentlyHereKey) {
      data[currentlyHereKey] = currentlyHere;
      if (currentlyHere) data.endDate = null;
    }

    if (editingId && editingId !== "__new__") {
      await update.mutateAsync({ id: editingId, data: data as TData });
    } else {
      await create.mutateAsync(data as TData);
    }
  };

  return {
    form,
    currentlyHere,
    showForm: editingId !== null,
    isPending: create.isPending || update.isPending,
    setCurrentlyHere,
    setFormField,
    startEdit,
    startCreate,
    cancel: resetEditor,
    submit,
    remove: (id: string) => remove.mutate(id),
  };
}
