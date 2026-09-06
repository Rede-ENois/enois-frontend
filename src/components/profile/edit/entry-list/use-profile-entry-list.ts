import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProfileEntryListProps } from "@/types/components/profile/edit/entry-list/profile-entry-list-props";

export function useProfileEntryList<T extends { id: string }, TInput extends object>(
  props: ProfileEntryListProps<T, TInput>,
) {
  const queryClient = useQueryClient();
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({ ...props.newEntry });
  const [isCurrentlyHere, setIsCurrentlyHere] = useState(false);

  const resetForm = () => {
    setEditingEntryId(null);
    setFormValues({ ...props.newEntry });
    setIsCurrentlyHere(false);
  };
  const invalidateEntries = () => queryClient.invalidateQueries({ queryKey: props.queryKey });

  const createEntryMutation = useMutation({
    mutationFn: (input: TInput) => props.createEntry(input),
    onSuccess: () => {
      invalidateEntries();
      resetForm();
    },
  });
  const updateEntryMutation = useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: TInput }) =>
      props.updateEntry(entryId, input),
    onSuccess: () => {
      invalidateEntries();
      resetForm();
    },
  });
  const removeEntryMutation = useMutation({
    mutationFn: (entryId: string) => props.removeEntry(entryId),
    onSuccess: invalidateEntries,
  });

  const handleEdit = (entry: T) => {
    setEditingEntryId(entry.id);
    setFormValues(
      Object.fromEntries(
        props.fields.map((field) => [
          field.key,
          String((entry as Record<string, unknown>)[field.key] ?? ""),
        ]),
      ),
    );
    if (props.currentlyHereKey) {
      setIsCurrentlyHere(Boolean((entry as Record<string, unknown>)[props.currentlyHereKey]));
    }
  };

  const handleCreate = () => {
    setEditingEntryId("__new__");
    setFormValues({ ...props.newEntry });
    setIsCurrentlyHere(false);
  };

  const handleSubmit = async () => {
    const inputValues: Record<string, unknown> = { ...formValues };
    if (props.currentlyHereKey) {
      inputValues[props.currentlyHereKey] = isCurrentlyHere;
      if (isCurrentlyHere) inputValues.endDate = null;
    }
    const input = inputValues as TInput;
    if (editingEntryId && editingEntryId !== "__new__") {
      await updateEntryMutation.mutateAsync({ entryId: editingEntryId, input });
    } else {
      await createEntryMutation.mutateAsync(input);
    }
  };

  return {
    editingEntryId,
    formValues,
    isCurrentlyHere,
    isPending: createEntryMutation.isPending || updateEntryMutation.isPending,
    setField: (key: string, value: string) =>
      setFormValues((currentValues) => ({ ...currentValues, [key]: value })),
    setIsCurrentlyHere,
    resetForm,
    handleEdit,
    handleCreate,
    handleSubmit,
    removeEntry: removeEntryMutation.mutate,
  };
}
