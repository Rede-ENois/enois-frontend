export type EditProfileInfoValues = {
  username: string;
  name: string;
  headline: string;
  bio: string;
  company: string;
  location: string;
  availability: string;
  portfolio: string;
  linksText: string;
  skillsText: string;
  goalsText: string;
  openToWork: boolean;
  isMentor: boolean;
};

export type EditProfileInfoChange = <K extends keyof EditProfileInfoValues>(
  field: K,
  value: EditProfileInfoValues[K],
) => void;

export type EditProfileInfoSectionProps = {
  values: EditProfileInfoValues;
  onChange: EditProfileInfoChange;
};

export type EditProfileInfoFieldsProps = EditProfileInfoSectionProps & {
  usernameError: string;
};
