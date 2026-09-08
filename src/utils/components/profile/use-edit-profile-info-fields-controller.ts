import { EDIT_PROFILE_INFO_FIELD_ROWS } from "@/constants/edit-profile-info-field-rows";
import { useEditProfileDialogContext } from "@/utils/components/profile/use-edit-profile-dialog-context";

export function useEditProfileInfoFieldsController() {
  const { profileInfo } = useEditProfileDialogContext();
  const { values, usernameError, setField, setUsername } = profileInfo;

  return {
    rows: EDIT_PROFILE_INFO_FIELD_ROWS.map((row) =>
      row.map((field) => ({
        ...field,
        value: values[field.field],
        error: field.field === "username" ? usernameError : undefined,
        setValue: (value: string) => {
          if (field.field === "username") setUsername(value);
          else setField(field.field, value);
        },
      })),
    ),
  };
}
