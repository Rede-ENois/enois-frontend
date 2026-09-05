import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProfileSubListProps } from "./profile-sub-list.types";

export function useProfileSubList<T extends { id: string }, TData extends object>(props: ProfileSubListProps<T, TData>) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...props.newItem });
  const [currentlyHere, setCurrentlyHere] = useState(false);

  const reset = () => {
    setEditingId(null);
    setForm({ ...props.newItem });
    setCurrentlyHere(false);
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: props.queryKey });
  const create = useMutation({ mutationFn: (data: TData) => props.createApi(data), onSuccess: () => { invalidate(); reset(); } });
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: TData }) => props.updateApi(id, data), onSuccess: () => { invalidate(); reset(); } });
  const remove = useMutation({ mutationFn: (id: string) => props.deleteApi(id), onSuccess: invalidate });

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setForm(Object.fromEntries(props.fields.map((field) => [field.key, String((item as Record<string, unknown>)[field.key] ?? "")])));
    if (props.currentlyHereKey) setCurrentlyHere(Boolean((item as Record<string, unknown>)[props.currentlyHereKey]));
  };

  const startCreate = () => {
    setEditingId("__new__");
    setForm({ ...props.newItem });
    setCurrentlyHere(false);
  };

  const submit = async () => {
    const data: Record<string, unknown> = { ...form };
    if (props.currentlyHereKey) {
      data[props.currentlyHereKey] = currentlyHere;
      if (currentlyHere) data.endDate = null;
    }
    const typedData = data as TData;
    if (editingId && editingId !== "__new__") await update.mutateAsync({ id: editingId, data: typedData });
    else await create.mutateAsync(typedData);
  };

  return {
    editingId,
    form,
    currentlyHere,
    isPending: create.isPending || update.isPending,
    setField: (key: string, value: string) => setForm((current) => ({ ...current, [key]: value })),
    setCurrentlyHere,
    reset,
    startEdit,
    startCreate,
    submit,
    remove: remove.mutate,
  };
}
