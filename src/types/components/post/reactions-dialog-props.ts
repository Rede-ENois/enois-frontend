export type ReactionsDialogProps = {
  postId: string;
  currentUserReaction: string | null;
  currentUserId?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};
