export type RegisterMentorFormProps = {
  skillsText: string;
  setSkillsText: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  saving: boolean;
  saveDisabled: boolean;
  save: () => void;
};
