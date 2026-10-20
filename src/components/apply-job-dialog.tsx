import { type ReactNode, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { Job } from "@/types/application/job/job";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { ApiError, jobsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Candidatura: responde o formulário que o autor montou e envia o perfil.
 *
 * A tela mostra o que vai junto (perfil, experiências, reputação) porque a candidatura entrega esses
 * dados ao empregador — e erros do backend aparecem com o motivo real (já candidatado, campo
 * obrigatório, conta não verificada), em vez de "erro inesperado".
 */
export function ApplyJobDialog({ job, children }: { job: Job; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState(false);

  const fields = job.applicationFields ?? [];
  const missingRequired = fields.filter(
    (field) => field.required && !(values[field.id] ?? "").trim(),
  );

  const apply = useMutation({
    mutationFn: () =>
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

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setError(null);
      if (done) {
        setDone(false);
        setMessage("");
        setValues({});
      }
    }
  };

  const errorMessage = () => {
    if (!error) return texts.errors.unexpected;
    // Mensagens do backend explicam o caso; as de negócio valem mais que um texto genérico.
    return error.message || texts.errors.unexpected;
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-normal">
            {texts.jobs.applyDialog.title(job.title)}
          </DialogTitle>

          <DialogDescription>{texts.jobs.applyDialog.intro}</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-growth" />

            <p className="mt-3 text-base font-medium">{texts.jobs.applyDialog.success}</p>

            <p className="mt-2 text-sm text-muted-foreground">
              {texts.jobs.applyDialog.successDescription}
            </p>

            <Button className="mt-5 w-full rounded-full" onClick={() => close(false)}>
              {texts.common.close}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-sm font-medium">{texts.jobs.applyDialog.aboutYou}</p>

              <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                <li>· {texts.jobs.applyDialog.aboutYouProfile}</li>

                <li>· {texts.jobs.applyDialog.aboutYouExperience}</li>

                <li>· {texts.jobs.applyDialog.aboutYouReputation}</li>
              </ul>
            </div>

            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-xs">
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>

                {field.type === "TEXTAREA" ? (
                  <Textarea
                    rows={3}
                    value={values[field.id] ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.id]: event.target.value }))
                    }
                  />
                ) : (
                  <Input
                    value={values[field.id] ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [field.id]: event.target.value }))
                    }
                    type={field.type === "NUMBER" ? "number" : "text"}
                    inputMode={field.type === "NUMBER" ? "numeric" : undefined}
                    placeholder={
                      field.type === "LINK" ? "https://" : field.type === "NUMBER" ? "0" : ""
                    }
                  />
                )}
              </div>
            ))}

            {fields.some((field) => field.required) && (
              <p className="text-xs text-muted-foreground">{texts.jobs.applyDialog.requiredHint}</p>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">{texts.jobs.applyDialog.message}</Label>

              <Textarea
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={texts.jobs.applyDialog.messagePlaceholder}
                maxLength={2000}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
                <p>{errorMessage()}</p>

                {error.code === "EMAIL_NOT_VERIFIED" && (
                  <Link to="/seguranca" className="mt-1 inline-block text-xs font-medium underline">
                    {texts.jobs.applyDialog.verifyIdentity}
                  </Link>
                )}
              </div>
            )}

            <Button
              className="w-full rounded-full gap-2"
              disabled={apply.isPending || missingRequired.length > 0}
              onClick={() => {
                setError(null);
                apply.mutate();
              }}
            >
              {apply.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}

              <>{apply.isPending ? texts.jobs.applyDialog.sending : texts.jobs.applyDialog.send}</>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
