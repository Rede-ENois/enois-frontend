import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProfileSubListProps } from "./profile-sub-list-types";

export function useProfileSubList<T extends { id: string }, TInput extends object>(
  props: ProfileSubListProps<T, TInput>,
) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({ ...props.newItem });
  const [isCurrentlyHere, setIsCurrentlyHere] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setFormValues({ ...props.newItem });
    setIsCurrentlyHere(false);
  };
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: props.queryKey });

  const createItemMutation = useMutation({
    mutationFn: (input: TInput) => props.createApi(input),
    onSuccess: () => {
      invalidateList();
      resetForm();
    },
  });
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: TInput }) =>
      props.updateApi(itemId, input),
    onSuccess: () => {
      invalidateList();
      resetForm();
    },
  });
  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => props.removeApi(itemId),
    onSuccess: invalidateList,
  });

  const handleEdit = (item: T) => {
    setEditingId(item.id);
    setFormValues(
      Object.fromEntries(
        props.fields.map((field) => [
          field.key,
          String((item as Record<string, unknown>)[field.key] ?? ""),
        ]),
      ),
    );
    if (props.currentlyHereKey) {
      setIsCurrentlyHere(Boolean((item as Record<string, unknown>)[props.currentlyHereKey]));
    }
  };

  const handleCreate = () => {
    setEditingId("__new__");
    setFormValues({ ...props.newItem });
    setIsCurrentlyHere(false);
  };

  const handleSubmit = async () => {
    const inputValues: Record<string, unknown> = { ...formValues };
    if (props.currentlyHereKey) {
      inputValues[props.currentlyHereKey] = isCurrentlyHere;
      if (isCurrentlyHere) inputValues.endDate = null;
    }
    const input = inputValues as TInput;
    if (editingId && editingId !== "__new__") {
      await updateItemMutation.mutateAsync({ itemId: editingId, input });
    } else {
      await createItemMutation.mutateAsync(input);
    }
  };

  return {
    editingId,
    formValues,
    isCurrentlyHere,
    isPending: createItemMutation.isPending || updateItemMutation.isPending,
    setField: (key: string, value: string) =>
      setFormValues((currentValues) => ({ ...currentValues, [key]: value })),
    setIsCurrentlyHere,
    resetForm,
    handleEdit,
    handleCreate,
    handleSubmit,
    removeItem: removeItemMutation.mutate,
  };
}
