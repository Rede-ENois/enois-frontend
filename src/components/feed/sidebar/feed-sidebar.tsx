import type { Event, NetworkUser, Profile } from "@/lib/api";

import { FeedSidebarEvents } from "./feed-sidebar-events";
import { FeedSidebarProfileCard } from "./feed-sidebar-profile-card";
import { FeedSidebarSuggestions } from "./feed-sidebar-suggestions";

type FeedSidebarProps = {
  profile: Profile | null | undefined;
  suggestions: NetworkUser[];
  events: Event[];
  onConnect: (userId: string) => void;
};

export function FeedSidebar({ profile, suggestions, events, onConnect }: FeedSidebarProps) {
  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto lg:block">
      {profile && <FeedSidebarProfileCard profile={profile} />}
      <FeedSidebarSuggestions suggestions={suggestions} onConnect={onConnect} />
      <FeedSidebarEvents events={events} />
    </aside>
  );
}
