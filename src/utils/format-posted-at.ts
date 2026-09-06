import { texts } from "@/texts";

export function formatPostedAt(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return texts.jobs.today;
  if (days < 30) return texts.jobs.daysAgo(days);
  return date.toLocaleDateString("pt-BR");
}
