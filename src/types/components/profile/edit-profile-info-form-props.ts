import type { EditProfileValues } from "@/types/components/profile/edit-profile-values";

export type EditProfileInfoFormProps = {
  values: EditProfileValues;
  usernameError: string;
  setField: <K extends keyof EditProfileValues>(key: K, value: EditProfileValues[K]) => void;
  setUsername: (value: string) => void;
};
