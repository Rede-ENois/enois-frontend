import type { ReportDialogFieldsProps } from "@/types/components/post/report-dialog-fields-props";

export type ReportDialogBodyProps = ReportDialogFieldsProps & {
  submit: () => void;
};
