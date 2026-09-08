import { createContext } from "react";

import type { useReactionsDialogController } from "@/utils/components/post/use-reactions-dialog-controller";

export const ReactionsDialogContext = createContext<
  ReturnType<typeof useReactionsDialogController> | null
>(null);
