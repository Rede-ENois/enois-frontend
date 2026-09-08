export type ReportDialogFieldsProps = {
  reason: string;
  reasonOptions: readonly {
    value: string;
    label: string;
  }[];
  setReason: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
};
