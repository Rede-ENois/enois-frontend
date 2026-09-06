import { texts } from "@/texts";
import type { FeedTabsProps } from "@/types/components/feed/feed-tabs-props";

const feedTabs = [
  { value: "FOR_YOU", label: texts.feed.tabs.forYou },
  { value: "ALL", label: texts.feed.tabs.all },
  { value: "FOLLOWING", label: texts.feed.tabs.following },
  { value: "RECENT", label: texts.feed.tabs.discussions },
  { value: "PROJECTS", label: texts.feed.tabs.projects },
] as const;

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {feedTabs.map((tab) => (
        <button key={tab.value} type="button" onClick={() => onTabChange(tab.value)} className={`rounded-full border px-3 py-1.5 text-[12px] font-light transition ${activeTab === tab.value ? "border-primary bg-primary text-primary-foreground" : "border-border-soft bg-surface-card text-text-subtle hover:text-text-strong"}`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
