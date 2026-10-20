import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { JOB_LEVELS, JOB_LOCATIONS, JOB_TYPES } from "@/constants/job-options";
import { texts } from "@/texts";
import type { CurrencyCode } from "@/types/application/currency/currency-code";
import type { CreateJobInput } from "@/types/application/job/create-job-input";
import type { Job } from "@/types/application/job/job";
import type { JobEditDialogProps } from "@/types/components/job/job-edit-dialog-props";

import { jobsApi } from "@/lib/api";
import { CURRENCIES, currencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-transparent bg-muted px-3 py-2 text-sm font-normal text-text-strong outline-none focus-visible:ring-1 focus-visible:ring-ring";

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
    <Dialog open={!!job} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.jobs.editJobTitle}</DialogTitle>

          <DialogDescription>{texts.jobs.editJobDescription}</DialogDescription>
        </DialogHeader>

        {job && (
          <EditForm
            key={job.id}
            job={job}
            saving={save.isPending}
            error={error}
            onSave={(data) => {
              setError(null);
              save.mutate(data);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Props do formulario interno; ficam inline porque so este arquivo usa. */
function EditForm({
  job,
  saving,
  error,
  onSave,
}: {
  job: Job;
  saving: boolean;
  error: string | null;
  onSave: (data: CreateJobInput) => void;
}) {
  const [title, setTitle] = useState(job.title);
  const [company, setCompany] = useState(job.company);
  const [location, setLocation] = useState(job.location);
  const [type, setType] = useState(job.type);
  const [level, setLevel] = useState(job.level);
  const [salary, setSalary] = useState(job.salary ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(
    (job.currency as CurrencyCode | null) ?? "BRL",
  );
  const [skills, setSkills] = useState(job.skills.join(", "));
  const [description, setDescription] = useState(job.description ?? "");

  const valid = title.trim() !== "" && company.trim() !== "";

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-text-subtle">{texts.jobs.fields.title}</Label>

        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-text-subtle">{texts.jobs.fields.company}</Label>

        <Input value={company} onChange={(e) => setCompany(e.target.value)} className="bg-muted" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-text-subtle">
            {texts.jobs.fields.location}
          </Label>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={SELECT_CLASS}
          >
            {JOB_LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-text-subtle">{texts.jobs.fields.type}</Label>

          <select value={type} onChange={(e) => setType(e.target.value)} className={SELECT_CLASS}>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-text-subtle">{texts.jobs.fields.level}</Label>

          <select value={level} onChange={(e) => setLevel(e.target.value)} className={SELECT_CLASS}>
            {JOB_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0) + l.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-text-subtle">{texts.jobs.fields.salary}</Label>

        <div className="flex gap-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className={cn(SELECT_CLASS, "w-32 shrink-0")}
            aria-label={texts.jobs.fields.currency}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          <Input
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder={texts.jobs.fields.salaryPlaceholder}
            className="bg-muted"
          />
        </div>

        <p className="text-xs font-normal text-text-subtle">
          {texts.jobs.fields.salaryHint(currencySymbol(currency))}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-text-subtle">{texts.jobs.fields.skills}</Label>

        <Input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder={texts.jobs.fields.skillsPlaceholder}
          className="bg-muted"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-text-subtle">
          {texts.jobs.fields.description}
        </Label>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder={texts.jobs.fields.descriptionPlaceholder}
          className="bg-muted"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        className="w-full rounded-full"
        disabled={!valid || saving}
        onClick={() =>
          onSave({
            title: title.trim(),
            company: company.trim(),
            location,
            type,
            level,
            salary: salary.trim() || undefined,
            currency,
            skills: skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            description: description.trim() || undefined,
            // Reenviados como estao: o PUT substitui a lista, entao omiti-los apagaria o formulario.
            applicationFields: (job.applicationFields ?? []).map((field) => ({
              label: field.label,
              type: field.type,
              required: field.required,
            })),
          })
        }
      >
        {saving ? texts.common.saving : texts.common.save}
      </Button>
    </div>
  );
}
