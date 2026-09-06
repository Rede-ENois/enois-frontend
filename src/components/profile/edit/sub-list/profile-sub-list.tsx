import { ProfileSubForm } from "./profile-sub-form";
import { ProfileSubItems } from "./profile-sub-items";
import type { ProfileSubListProps } from "./profile-sub-list-types";
import { useProfileSubList } from "./use-profile-sub-list";

export function ProfileSubList<T extends { id: string }, TInput extends object>(
  props: ProfileSubListProps<T, TInput>,
) {
  const listState = useProfileSubList(props);

  return (
    <div className="space-y-4">
      {listState.editingId !== null ? (
        <ProfileSubForm
          fields={props.fields}
          formValues={listState.formValues}
          currentlyHereKey={props.currentlyHereKey}
          isCurrentlyHere={listState.isCurrentlyHere}
          isPending={listState.isPending}
          onFieldChange={listState.setField}
          onCurrentlyHereChange={listState.setIsCurrentlyHere}
          onSubmit={listState.handleSubmit}
          onCancel={listState.resetForm}
        />
      ) : (
        <ProfileSubItems
          items={props.items}
          fields={props.fields}
          emptyMessage={props.emptyMessage}
          onEdit={listState.handleEdit}
          onDelete={listState.removeItem}
          onAdd={listState.handleCreate}
        />
      )}
    </div>
  );
}
