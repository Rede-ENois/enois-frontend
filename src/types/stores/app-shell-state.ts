export type AppShellState = {
  mobileNavigationOpen: boolean;
  openMobileNavigation: () => void;
  closeMobileNavigation: () => void;
  /** A conversation fills the screen: the dock steps aside so it never covers the composer. */
  conversationOpen: boolean;
  setConversationOpen: (open: boolean) => void;
};
