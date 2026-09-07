import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";

import { createSubListSubmitData } from "@/utils/components/profile/create-sub-list-submit-data";
import { useSubListEditorState } from "@/utils/components/profile/use-sub-list-editor-state";
import { useSubListMutations } from "@/utils/components/profile/use-sub-list-mutations";

export function useSubListEditor<
  T extends Record<"id", string>,
  TData extends Record<string, unknown> = Record<string, string>,
>(props: SubListProps<T, TData>) {
  const state = useSubListEditorState(props.fields, props.currentlyHereKey, props.newItem);
  const mutations = useSubListMutations(props, state.reset);

  const submit = async () => {
    const data = createSubListSubmitData(
      state.form,
      props.currentlyHereKey,
      state.currentlyHere,
    ) as TData;

    if (state.editingId && state.editingId !== "__new__") {
      await mutations.update(state.editingId, data);
    } else {
      await mutations.create(data);
    }
  };

  return {
    form: state.form,
    currentlyHere: state.currentlyHere,
    showForm: state.editingId !== null,
    isPending: mutations.isPending,
    setCurrentlyHere: state.setCurrentlyHere,
    setFormField: state.setFormField,
    startEdit: state.startEdit,
    startCreate: state.startCreate,
    cancel: state.reset,
    submit,
    remove: mutations.remove,
  };
}
