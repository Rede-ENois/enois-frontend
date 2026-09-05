import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { texts } from "@/texts";

type RelativeTimeRule = {
  matches: (minutes: number) => boolean;
  format: (minutes: number) => string;
};

const relativeTimeRules: RelativeTimeRule[] = [
  { matches: (minutes) => minutes < 1, format: () => texts.time.now },
  { matches: (minutes) => minutes < 60, format: (minutes) => texts.time.minutesAgo(minutes) },
  {
    matches: (minutes) => minutes < 60 * 24,
    format: (minutes) => texts.time.hoursAgo(Math.floor(minutes / 60)),
  },
  {
    matches: (minutes) => minutes < 60 * 24 * 7,
    format: (minutes) => texts.time.daysAgo(Math.floor(minutes / (60 * 24))),
  },
];

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  const rule = relativeTimeRules.find(({ matches }) => matches(minutes));

  return rule?.format(minutes) ?? date.toLocaleDateString("pt-BR");
}

export function formatNotificationTime(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = parseISO(iso);
  return isValid(date)
    ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    : "";
}
