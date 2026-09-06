import type { ControlledDialogProps } from "@/types/components/shared/controlled-dialog-props";

import type { UseReactionsDialogOptions } from "./use-reactions-dialog-options";

export type ReactionsDialogProps = UseReactionsDialogOptions &
  Pick<ControlledDialogProps, "onOpenChange">;
