import type { Profile } from "@/lib/api";

export type ProfileRecommendSectionProps = {
  user: Profile;
  isOpen: boolean;
  comment: string;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
};
