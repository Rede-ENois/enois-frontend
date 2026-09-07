export type ProfileRecommendationDialogProps = {
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  sending: boolean;
  sendDisabled: boolean;
  onSend: () => void;
};
