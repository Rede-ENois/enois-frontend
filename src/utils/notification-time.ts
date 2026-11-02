import { texts } from "@/texts";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { formatarData, partesDaData } from "@/lib/date/format";

export function formatNotificationTime(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = parseISO(iso);

  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR }) : "";
}

/**
 * Day group of a notification on the full page: "Hoje", "Ontem", or the date ("28 de out.").
 * `now` is injectable so the grouping is tested without the clock.
 */
export function notificationDayLabel(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "";
  const date = parseISO(iso);
  if (!isValid(date)) return "";

  // Calendar days in the app time zone, so server and browser group the same way.
  const day = partesDaData(date);
  const today = partesDaData(now);
  if (!day || !today) return "";
  const days = Math.round(
    (Date.UTC(today.ano, today.mes - 1, today.dia) - Date.UTC(day.ano, day.mes - 1, day.dia)) /
      86_400_000,
  );
  if (days <= 0) return texts.notificationsPage.today;
  if (days === 1) return texts.notificationsPage.yesterday;
  return formatarData(date, {
    day: "numeric",
    month: "short",
    ...(day.ano === today.ano ? {} : { year: "numeric" }),
  });
}
