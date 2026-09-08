import type { EventCardMediaProps } from "@/types/components/events/event-card-media-props";

export function EventCardMedia({ coverUrl, monthLabel, dayLabel }: EventCardMediaProps) {
  return (
    <div className="relative">
      {coverUrl ? (
        <img src={coverUrl} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
      )}

      <div className="absolute left-4 top-4 rounded-xl bg-card/95 px-3 py-2 text-center shadow-md backdrop-blur">
        <p className="text-[10px] font-medium uppercase text-primary">{monthLabel}</p>
        <p className="text-lg font-semibold leading-none">{dayLabel}</p>
      </div>
    </div>
  );
}
