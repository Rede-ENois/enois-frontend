import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { SuspiciousUsersSection as SuspiciousUsersSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { moderationApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";

const BAN_TYPES: ("BAN" | "PERMABAN")[] = ["BAN", "PERMABAN"];

/** Triagem de contas recém-criadas: sinais objetivos, seleção múltipla e banimento em lote. */
export function SuspiciousUsersSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const suspicious = useQuery({
    queryKey: ["moderator", "suspicious"],
    queryFn: () => moderationApi.suspiciousUsers(100, 90),
    retry: false,
  });

  const ban = useMutation({
    mutationFn: ({
      usernames,
      type,
      reason,
    }: {
      usernames: string[];
      type: "BAN" | "PERMABAN";
      reason: string;
    }) => moderationApi.bulkBan(usernames, type, reason),
    onSuccess: (result) => {
      toast(
        texts.moderator.suspicious.result(result.banned, result.alreadyBanned, result.failed),
        result.failed > 0 ? "error" : "success",
      );
      // "N falha(s)" sozinho não diz o que aconteceu: quem falhou e por quê vem junto.
      const failures = result.items
        .filter((item) => item.status === "FAILED")
        .slice(0, 3)
        .map((item) => `@${item.username} (${item.message})`);
      if (failures.length > 0) {
        toast(texts.moderator.suspicious.failures(failures.join(", ")), "error");
      }
      if (result.blockedIps.length > 0) {
        toast(texts.moderator.suspicious.blockedIps(result.blockedIps.length), "success");
      }
      void queryClient.invalidateQueries({ queryKey: ["moderator", "suspicious"] });
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : texts.moderator.suspicious.error, "error");
    },
  });

  const users = (suspicious.data?.items ?? []).map((item) => ({
    ...item,
    createdAtLabel: dataCurta(item.createdAt),
  }));

  return (
    <SuspiciousUsersSectionView
      loading={suspicious.isLoading}
      error={suspicious.isError}
      users={users}
      banTypes={BAN_TYPES}
      banPending={ban.isPending}
      onBan={(usernames, type, reason) =>
        ban.mutateAsync({ usernames, type: type as "BAN" | "PERMABAN", reason }).then(
          () => true,
          () => false,
        )
      }
    />
  );
}
