import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { texts } from "@/texts";
import type { RelativeTimeRule } from "@/types/application/time/relative-time-rule";

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

export function formatJobPostedAt(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const rules = [
    { matches: days < 1, value: texts.jobs.today },
    { matches: days < 30, value: texts.jobs.daysAgo(days) },
  ];
  return rules.find((rule) => rule.matches)?.value ?? date.toLocaleDateString("pt-BR");
}

export function getIsoDateParts(iso: string | null | undefined): {
  year: string;
  month: string;
  day: string;
} {
  const [year = "", month = "", day = ""] = (iso ?? "").split("-");
  return { year, month, day };
}
