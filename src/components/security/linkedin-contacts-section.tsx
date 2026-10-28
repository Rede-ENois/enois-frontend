import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { LinkedinContactsSection as LinkedinContactsSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { linkedinContactsApi } from "@/lib/api";

/** Contatos do LinkedIn (Connections.csv): resumo, convite automático e importação. */
export function LinkedinContactsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resumo = useQuery({
    queryKey: ["linkedin-contacts"],
    queryFn: () => linkedinContactsApi.summary(),
  });

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => linkedinContactsApi.setAutoInvite(enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(["linkedin-contacts"], data);
      toast(
        data.autoInvite
          ? texts.account.linkedinContacts.autoOn
          : texts.account.linkedinContacts.autoOff,
        "success",
      );
    },
    onError: (error) => toast(error.message, "error"),
  });

  const importar = useMutation({
    mutationFn: (file: File) => linkedinContactsApi.importContacts(file),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["linkedin-contacts"] });
      toast(texts.account.linkedinContacts.imported(data.invited, data.queued), "success");
    },
    onError: (error) => toast(error.message, "error"),
  });

  return (
    <LinkedinContactsSectionView
      summary={resumo.data ?? null}
      loadError={resumo.isError}
      onRetry={() => void resumo.refetch()}
      retrying={resumo.isFetching}
      onAutoInviteChange={(enabled) => toggle.mutate(enabled)}
      autoInvitePending={toggle.isPending}
      onImport={(file) => importar.mutate(file)}
      importPending={importar.isPending}
    />
  );
}
