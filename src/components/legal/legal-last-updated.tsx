import { texts } from "@/texts";

export function LegalLastUpdated({ date }: { date: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      {texts.legal.footer.lastUpdated} <time dateTime={date}>{date}</time>
    </p>
  );
}
