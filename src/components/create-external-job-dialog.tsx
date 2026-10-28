import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { MIN_REPUTATION_TO_CREATE_JOB } from "@/constants/job-rules";
import { texts } from "@/texts";
import type { CreateExternalJobInput } from "@/types/application/job/create-external-job-input";
import type { CreateExternalJobDialogProps } from "@/types/routes/jobs/create-external-job-dialog-props";
import { CreateExternalJobDialog as CreateExternalJobDialogView } from "@rede-enois/design-system/domain";

import { ApiError, jobsApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { canCreateJob, missingReputationToCreateJob } from "@/lib/job-permissions";

/**
 * Cadastro de vaga EXTERNA: a pessoa cola uma vaga achada em outro site e o Énóis só lista.
 *
 * Mesmo gate de reputação da vaga da casa e a mesma declaração da comunidade: cadastrar vaga é
 * um ato de confiança, de qualquer origem.
 */
export function CreateExternalJobDialog({ open, onOpenChange }: CreateExternalJobDialogProps) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const reputation = user?.reputation ?? 0;
  const canPublish = canCreateJob(reputation);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (data: CreateExternalJobInput) => jobsApi.submitExternal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onOpenChange(false);
    },
    // A mensagem do backend manda (vaga duplicada, link inválido): é ela que explica o motivo.
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : texts.jobs.external.registerError),
  });

  return (
    <CreateExternalJobDialogView
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setError(null);
        onOpenChange(nextOpen);
      }}
      gate={
        canPublish
          ? null
          : {
              minReputation: MIN_REPUTATION_TO_CREATE_JOB,
              reputation,
              missing: missingReputationToCreateJob(reputation),
            }
      }
      pending={create.isPending}
      error={error}
      onSubmit={(values) => {
        setError(null);
        create.mutate(values);
      }}
    />
  );
}
