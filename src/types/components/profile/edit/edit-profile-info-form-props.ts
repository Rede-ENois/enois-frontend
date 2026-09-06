import type { EditProfileInfoChange } from "./edit-profile-info-change";
import type { EditProfileInfoValues } from "./edit-profile-info-values";

export type EditProfileInfoFormProps = {
  values: EditProfileInfoValues;
  usernameError: string;
  onChange: EditProfileInfoChange;
};
