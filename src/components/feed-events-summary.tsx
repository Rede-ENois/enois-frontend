import { texts } from "@/texts";
import { useFeedEventsSummaryController } from "@/utils/components/feed/use-feed-events-summary-controller";
import { TrendingUp } from "lucide-react";

export function FeedEventsSummary() {
  const { visible, items } = useFeedEventsSummaryController();

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />

        <h3 className="text-[14px] font-light text-text-strong">
          {texts.feed.sidebar.happeningNow}
        </h3>
      </div>

      <ul className="mt-3 space-y-3">
        {items.map(({ event, meta }) => (
          <li key={event.id}>
            <p className="text-[13px] font-light text-text-strong">{event.title}</p>

            <p className="text-[11px] font-light text-text-subtle">{meta}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
