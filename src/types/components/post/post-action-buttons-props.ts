export type PostActionButtonsProps = {
  comments: number;
  saves: number;
  saved: boolean;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
  onToggleSave: () => void;
};
