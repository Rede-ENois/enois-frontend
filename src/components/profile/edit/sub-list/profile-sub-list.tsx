import { ProfileSubForm } from "./profile-sub-form";
import { ProfileSubItems } from "./profile-sub-items";
import type { ProfileSubListProps } from "./profile-sub-list.types";
import { useProfileSubList } from "./use-profile-sub-list";

export function ProfileSubList<T extends { id: string }, TData extends object>(props: ProfileSubListProps<T, TData>) {
  const state = useProfileSubList(props);

  return (
    <div className="space-y-4">
      {state.editingId !== null ? (
        <ProfileSubForm
          fields={props.fields}
          form={state.form}
          currentlyHereKey={props.currentlyHereKey}
          currentlyHere={state.currentlyHere}
          pending={state.isPending}
          onFieldChange={state.setField}
          onCurrentlyHereChange={state.setCurrentlyHere}
          onSubmit={state.submit}
          onCancel={state.reset}
        />
      ) : (
        <ProfileSubItems
          items={props.items}
          fields={props.fields}
          emptyMessage={props.emptyMessage}
          onEdit={state.startEdit}
          onDelete={state.remove}
          onAdd={state.startCreate}
        />
      )}
    </div>
  );
}
