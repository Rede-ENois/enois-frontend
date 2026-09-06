import { texts } from "@/texts";

export function formatPostTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return texts.time.now;
  if (diffMin < 60) return texts.time.minutesAgo(diffMin);
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return texts.time.hoursAgo(diffH);
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return texts.time.daysAgo(diffD);
  return date.toLocaleDateString("pt-BR");
}
