export type JobsFiltersInputsProps = {
  query: string;
  skills: string;
  onQueryChange: (value: string) => void;
  onSkillsChange: (value: string) => void;
};
