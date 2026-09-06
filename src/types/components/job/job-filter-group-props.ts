export type JobFilterGroupProps = {
  label: string;
  values: readonly string[];
  selected: string;
  onChange: (value: string) => void;
  getLabel?: (value: string) => string;
};
