import type { RefObject } from "react";

export type CallReportDialogProps = {
  callId: string;
  /** O `iframe` da sala: é para ele que se pede a captura do momento. */
  frameRef: RefObject<HTMLIFrameElement | null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
