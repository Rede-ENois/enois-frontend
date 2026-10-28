export type ProfileStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  statusText: string | null | undefined;
  statusIcon: string | null | undefined;
};
