import type { FeedSidebarProps } from "@/types/components/feed/feed-sidebar-props";

import { FeedSidebarEvents } from "./feed-sidebar-events";
import { FeedSidebarProfileCard } from "./feed-sidebar-profile-card";
import { FeedSidebarSuggestions } from "./feed-sidebar-suggestions";

export function FeedSidebar({ currentUser, suggestions, events, onConnectSuggestion }: FeedSidebarProps) {
  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto lg:block">
      {currentUser && <FeedSidebarProfileCard currentUser={currentUser} />}
      <FeedSidebarSuggestions suggestions={suggestions} onConnectSuggestion={onConnectSuggestion} />
      <FeedSidebarEvents events={events} />
    </aside>
  );
}
