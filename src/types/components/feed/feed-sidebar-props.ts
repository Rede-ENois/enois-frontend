import type { Event } from "@/types/application/event/event";
import type { NetworkUser } from "@/types/application/network/network-user";
import type { Profile } from "@/types/application/profile/profile";

export type FeedSidebarProps = {
  currentUser: Profile | null | undefined;
  suggestions: NetworkUser[];
  events: Event[];
  onConnectSuggestion: (userId: string) => void;
};
