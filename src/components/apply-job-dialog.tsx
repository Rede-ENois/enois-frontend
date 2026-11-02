import { type ReactNode, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Job } from "@/types/application/job/job";
import {
  ApplyJobDialog as ApplyJobDialogView,
  type JobApplicationValues,
} from "@rede-enois/design-system/domain";

import { ApiError, jobsApi, resumeImportApi } from "@/lib/api";
import { useProfessionalIdentity } from "@/lib/use-professional-identity";

/**
 * Candidatura: responde o formulário que o autor montou e envia o perfil.
 *
 * Erros do backend aparecem com o motivo real (já candidatado, campo obrigatório, conta não
 * verificada), em vez de "erro inesperado".
 */
export function ApplyJobDialog({ job, children }: { job: Job; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState(false);

  const fields = job.applicationFields ?? [];
  // A candidatura é SEMPRE da identidade profissional: o diálogo diz qual, ou leva a ativá-la.
  const { applicant, professionalSetupHref } = useProfessionalIdentity();

  const apply = useMutation({
    mutationFn: ({ message, values }: JobApplicationValues) =>
      jobsApi.apply(job.id, {
        message: message.trim() || undefined,
        answers: fields
          .filter((field) => (values[field.id] ?? "").trim() !== "")
          .map((field) => ({ fieldId: field.id, value: values[field.id].trim() })),
      }),
    onSuccess: () => {
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err : null),
  });

  // Preenche a inscrição com o currículo: sobe o arquivo + o id da vaga e recebe mensagem e
  // respostas sugeridas. Só sugere — a pessoa revisa e envia pelo fluxo existente.
  const prefill = async (file: File) => {
    try {
      return await resumeImportApi.prefillApplication(job.id, file);
    } catch (err) {
      throw new Error(err instanceof ApiError ? err.message : texts.errors.unexpected);
    }
  };

  // Mensagens do backend explicam o caso; as de negócio valem mais que um texto genérico.
  const errorMessage = error ? error.message || texts.errors.unexpected : null;

  return (
    <ApplyJobDialogView
      job={job}
      onOpenChange={(next) => {
        if (!next) {
          setError(null);
          if (done) setDone(false);
        }
      }}
      pending={apply.isPending}
      done={done}
      error={errorMessage}
      verifyHref={error?.code === "EMAIL_NOT_VERIFIED" ? "/seguranca" : null}
      applicant={applicant}
      professionalSetupHref={
        professionalSetupHref ??
        (error?.code === "NO_ACTIVE_CORPORATE_PROFILE" ? "/profissional" : null)
      }
      onSubmit={(values) => {
        setError(null);
        apply.mutate(values);
      }}
      onPrefill={prefill}
    >
      {children}
    </ApplyJobDialogView>
  );
}
