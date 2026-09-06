import type { WithRequiredChildren } from "@/types/components/with-required-children";

export type CreateCommunityDialogProps = WithRequiredChildren<{
  open: boolean;
  onOpenChange: (value: boolean) => void;
}>;
