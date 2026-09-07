export type MessagesSidebarHeaderProps = {
  showSearch: boolean;
  searchToggleLabel: string;
  onToggleSearch: () => void;
  onSelect: (conversationId: string) => void;
  onCloseSearch: () => void;
};
