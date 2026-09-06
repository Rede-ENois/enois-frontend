import type { ProfileEntryListProps } from "@/types/components/profile/edit/entry-list/profile-entry-list-props";

import { ProfileEntryForm } from "./profile-entry-form";
import { ProfileEntryItems } from "./profile-entry-items";
import { useProfileEntryList } from "./use-profile-entry-list";

export function ProfileEntryList<T extends { id: string }, TInput extends object>(
  props: ProfileEntryListProps<T, TInput>,
) {
  const entryListState = useProfileEntryList(props);

  return (
    <div className="space-y-4">
      {entryListState.editingEntryId !== null ? (
        <ProfileEntryForm
          fields={props.fields}
          formValues={entryListState.formValues}
          currentlyHereKey={props.currentlyHereKey}
          isCurrentlyHere={entryListState.isCurrentlyHere}
          isPending={entryListState.isPending}
          onFieldChange={entryListState.setField}
          onCurrentlyHereChange={entryListState.setIsCurrentlyHere}
          onSubmit={entryListState.handleSubmit}
          onCancel={entryListState.resetForm}
        />
      ) : (
        <ProfileEntryItems
          entries={props.entries}
          fields={props.fields}
          emptyMessage={props.emptyMessage}
          onEdit={entryListState.handleEdit}
          onDelete={entryListState.removeEntry}
          onAdd={entryListState.handleCreate}
        />
      )}
    </div>
  );
}
