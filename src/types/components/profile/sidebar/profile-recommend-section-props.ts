import type { Profile } from "@/lib/api";
import type { ControlledDialogProps } from "@/types/components/shared/controlled-dialog-props";

export type ProfileRecommendSectionProps = ControlledDialogProps & {
  user: Profile;
  comment: string;
  isPending: boolean;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
};
