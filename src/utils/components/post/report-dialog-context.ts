import { createContext } from "react";

import type { useReportDialogController } from "@/utils/components/post/use-report-dialog-controller";

export const ReportDialogContext = createContext<ReturnType<
  typeof useReportDialogController
> | null>(null);
