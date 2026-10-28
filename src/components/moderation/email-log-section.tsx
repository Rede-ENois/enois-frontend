import { useQuery } from "@tanstack/react-query";

import { EmailLogSection as EmailLogSectionView } from "@rede-enois/design-system/domain";

import { moderationApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

/** Metadados dos e-mails enviados: útil para ver falha de SMTP sem abrir caixa de mensagens. */
export function EmailLogSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["moderator", "emails"],
    queryFn: () => moderationApi.emails(100),
    retry: false,
  });

  const emails = (data ?? []).map((item) => ({
    ...item,
    createdAtLabel: dataHora(item.createdAt),
  }));

  return <EmailLogSectionView loading={isLoading} emails={emails} />;
}
