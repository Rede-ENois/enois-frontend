import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatNotificationTime(iso: string | null | undefined): string {
  if (!iso) return "";

  const date = parseISO(iso);

  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR }) : "";
}
