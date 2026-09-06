export type JobsFiltersProps = {
  query: string;
  level: string;
  location: string;
  type: string;
  skills: string;
  onQueryChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSkillsChange: (value: string) => void;
  onClear: () => void;
};
