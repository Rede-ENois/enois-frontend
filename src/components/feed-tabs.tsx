import { useFeedTabsController } from "@/utils/components/feed/use-feed-tabs-controller";

import { TabButton } from "@/components/tab-button";

export function FeedTabs() {
  const { tabs } = useFeedTabsController();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tabs.map((tab) => (
        <TabButton key={tab.key} variant="feed" active={tab.active} onClick={tab.select}>
          {tab.label}
        </TabButton>
      ))}
    </div>
  );
}
