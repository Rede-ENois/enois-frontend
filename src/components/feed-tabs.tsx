import { texts } from "@/texts";
import { useFeedPageContext } from "@/utils/components/feed/use-feed-page-context";

import { TabButton } from "@/components/tab-button";

export function FeedTabs() {
  const { activeTab, onTabChange } = useFeedPageContext();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <TabButton
        variant="feed"
        active={activeTab === "FOR_YOU"}
        onClick={() => onTabChange("FOR_YOU")}
      >
        {texts.feed.tabs.forYou}
      </TabButton>

      <TabButton variant="feed" active={activeTab === "ALL"} onClick={() => onTabChange("ALL")}>
        {texts.feed.tabs.all}
      </TabButton>

      <TabButton
        variant="feed"
        active={activeTab === "FOLLOWING"}
        onClick={() => onTabChange("FOLLOWING")}
      >
        {texts.feed.tabs.following}
      </TabButton>

      <TabButton
        variant="feed"
        active={activeTab === "RECENT"}
        onClick={() => onTabChange("RECENT")}
      >
        {texts.feed.tabs.discussions}
      </TabButton>

      <TabButton
        variant="feed"
        active={activeTab === "PROJECTS"}
        onClick={() => onTabChange("PROJECTS")}
      >
        {texts.feed.tabs.projects}
      </TabButton>
    </div>
  );
}
