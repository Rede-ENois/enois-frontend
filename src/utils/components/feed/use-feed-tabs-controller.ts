import { texts } from "@/texts";
import { useFeedPageContext } from "@/utils/components/feed/use-feed-page-context";

export function useFeedTabsController() {
  const { activeTab, onTabChange } = useFeedPageContext();

  return {
    tabs: [
      {
        key: "FOR_YOU",
        label: texts.feed.tabs.forYou,
        active: activeTab === "FOR_YOU",
        select: () => onTabChange("FOR_YOU"),
      },
      {
        key: "ALL",
        label: texts.feed.tabs.all,
        active: activeTab === "ALL",
        select: () => onTabChange("ALL"),
      },
      {
        key: "FOLLOWING",
        label: texts.feed.tabs.following,
        active: activeTab === "FOLLOWING",
        select: () => onTabChange("FOLLOWING"),
      },
      {
        key: "RECENT",
        label: texts.feed.tabs.discussions,
        active: activeTab === "RECENT",
        select: () => onTabChange("RECENT"),
      },
      {
        key: "PROJECTS",
        label: texts.feed.tabs.projects,
        active: activeTab === "PROJECTS",
        select: () => onTabChange("PROJECTS"),
      },
    ],
  };
}
