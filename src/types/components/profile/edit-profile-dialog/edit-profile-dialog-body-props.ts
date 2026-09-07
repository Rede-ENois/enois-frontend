import type { EditProfileInfoFormProps } from "@/types/components/profile/edit-profile-info-form-props";

export type EditProfileDialogBodyProps = {
  activeTab: "info" | "experiences" | "education" | "certifications";
  profileInfo: EditProfileInfoFormProps;
};
