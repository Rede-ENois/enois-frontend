import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  JOB_LEVELS,
  JOB_LOCATIONS,
  JOB_TYPES,
  SALARY_PERIODS,
  jobLevelLabel,
  jobTypeLabel,
} from "@/constants/job-options";
import { texts } from "@/texts";
import type { CreateJobInput } from "@/types/application/job/create-job-input";
import type { JobEditDialogProps } from "@/types/components/job/job-edit-dialog-props";
import {
  JobEditDialog as JobEditDialogView,
  type JobEditOptions,
} from "@rede-enois/design-system/domain";

import { jobsApi } from "@/lib/api";
import { CURRENCIES } from "@/lib/currency";

const OPTIONS: JobEditOptions = {
  locations: JOB_LOCATIONS,
  types: JOB_TYPES.map((value) => ({ value, label: jobTypeLabel(value) })),
  levels: JOB_LEVELS.map((value) => ({ value, label: jobLevelLabel(value) })),
  salaryPeriods: SALARY_PERIODS,
  currencies: CURRENCIES,
};

/**
 * Edicao de vaga publicada por voce.
 *
 * Os campos do formulario de candidatura NAO sao editaveis aqui de proposito: o `PUT` substitui
 * o que for enviado, entao eles sao reenviados como estao — senao a vaga perderia o formulario
 * que o autor montou. Quem quiser mudar isso recria a vaga.
 */
export function JobEditDialog({ job, onOpenChange }: JobEditDialogProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (data: CreateJobInput) => jobsApi.update(job!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onOpenChange(false);
    },
    onError: () => setError(texts.jobs.updateError),
  });

  return (
    <JobEditDialogView
      job={job}
      onOpenChange={onOpenChange}
      options={OPTIONS}
      saving={save.isPending}
      error={error}
      onSave={(values) => {
        setError(null);
        save.mutate({
          ...values,
          // Reenviados como estao: o PUT substitui a lista, entao omiti-los apagaria o formulario.
          applicationFields: (job?.applicationFields ?? []).map((field) => ({
            label: field.label,
            type: field.type,
            required: field.required,
          })),
        });
      }}
    />
  );
}
