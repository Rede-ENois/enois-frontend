import { accessibilityTexts } from "@/texts/accessibility";
import { authTexts } from "@/texts/auth";
import { brandTexts } from "@/texts/brand";
import { commonTexts } from "@/texts/common";
import { communitiesTexts } from "@/texts/communities";
import { errorsTexts } from "@/texts/errors";
import { eventsTexts } from "@/texts/events";
import { feedTexts } from "@/texts/feed";
import { jobsTexts } from "@/texts/jobs";
import { landingTexts } from "@/texts/landing";
import { legalTexts } from "@/texts/legal";
import { mentionsTexts } from "@/texts/mentions";
import { mentoringTexts } from "@/texts/mentoring";
import { messagesTexts } from "@/texts/messages";
import { navigationTexts } from "@/texts/navigation";
import { networkTexts } from "@/texts/network";
import { notificationsTexts } from "@/texts/notifications";
import { postsTexts } from "@/texts/posts";
import { profileTexts } from "@/texts/profile";
import { rootTexts } from "@/texts/root";
import { savedTexts } from "@/texts/saved";
import { searchTexts } from "@/texts/search";
import { themeTexts } from "@/texts/theme";
import { timeTexts } from "@/texts/time";

export const texts = {
  common: commonTexts,
  brand: brandTexts,
  navigation: navigationTexts,
  accessibility: accessibilityTexts,
  theme: themeTexts,
  search: searchTexts,
  mentions: mentionsTexts,
  notifications: notificationsTexts,
  errors: errorsTexts,
  auth: authTexts,
  landing: landingTexts,
  feed: feedTexts,
  posts: postsTexts,
  time: timeTexts,
  profile: profileTexts,
  communities: communitiesTexts,
  events: eventsTexts,
  jobs: jobsTexts,
  mentoring: mentoringTexts,
  network: networkTexts,
  messages: messagesTexts,
  saved: savedTexts,
  legal: legalTexts,
  root: rootTexts,
} as const;
