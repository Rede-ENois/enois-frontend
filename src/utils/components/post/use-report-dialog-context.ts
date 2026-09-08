import { useContext } from "react";

import { ReportDialogContext } from "@/utils/components/post/report-dialog-context";

export function useReportDialogContext() {
  const context = useContext(ReportDialogContext);

  if (!context) {
    throw new Error("Report dialog components must be rendered inside ReportDialogProvider");
  }

  return context;
}
