export type NotificationsPopoverTabsProps = {
  newSelected: boolean;
  historySelected: boolean;
  newCount: number | string | null;
  onOpenNew: () => void;
  onOpenHistory: () => void;
};
