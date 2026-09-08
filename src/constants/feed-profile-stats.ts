import { texts } from "@/texts";

export const FEED_PROFILE_STATS = [
  { key: "connections", field: "connectionsCount", label: texts.feed.sidebar.connections },
  { key: "followers", field: "followersCount", label: texts.feed.sidebar.followers },
] as const;
