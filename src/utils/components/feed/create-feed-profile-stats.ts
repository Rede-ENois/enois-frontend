import { FEED_PROFILE_STATS } from "@/constants/feed-profile-stats";
import type { Profile } from "@/types/application/profile/profile";

export function createFeedProfileStats(profile: Profile) {
  return FEED_PROFILE_STATS.map(({ field, ...stat }) => ({
    ...stat,
    value: profile[field],
  }));
}
