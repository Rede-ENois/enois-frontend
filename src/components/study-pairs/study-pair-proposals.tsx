import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { StudyPairIcebreakerAnswers } from "@/types/application/study-pairs/study-pair-icebreaker-answers";
import type { StudyPairIcebreakerField } from "@/types/application/study-pairs/study-pair-icebreaker-field";
import type { StudyPairProposalView } from "@/types/application/study-pairs/study-pair-proposal-view";
import { Button, useToast } from "@rede-enois/design-system/ui";

import { ApiError, studyPairsApi } from "@/lib/api";
import { dataCurta } from "@/lib/date/format";

const copy = texts.studyPairs.proposals;

function questionOf(field: StudyPairIcebreakerField): string {
  const known = copy.fields[field.id as keyof typeof copy.fields];
  return known && "question" in known ? known.question : field.question;
}

function placeholderOf(id: string): string {
  const known = copy.fields[id as keyof typeof copy.fields];
  return known && "placeholder" in known ? known.placeholder : "";
}

function optionsOf(field: StudyPairIcebreakerField): readonly string[] | null {
  const known = copy.fields[field.id as keyof typeof copy.fields];
  if (known && "options" in known) return known.options;
  return field.options.length > 0 ? field.options : null;
}

/**
 * Propostas de par: o casamento nasce pendente e só vira par com o aceite dos dois. O quebra-gelo
 * é respondido no próprio card, antes do aceite; o da outra pessoa só aparece depois do meu
 * (revelação simétrica, decidida no servidor). Recusar devolve o pedido para a fila.
 */
export function StudyPairProposals({ proposals }: { proposals: StudyPairProposalView[] }) {
  if (proposals.length === 0) return null;
  return (
    <section className="space-y-3" aria-label={copy.title}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>

        <p className="mt-1 text-sm text-muted-foreground">{copy.hint}</p>
      </div>

      {proposals.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} />
      ))}
    </section>
  );
}

function ProposalCard({ proposal }: { proposal: StudyPairProposalView }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<StudyPairIcebreakerAnswers>({});
  const [missing, setMissing] = useState(false);
  // As perguntas (e opções) vêm do catálogo do servidor; os textos do app só traduzem pelo id.
  const catalog = useQuery({
    queryKey: ["study-pairs", "icebreakers"],
    queryFn: () => studyPairsApi.icebreakers(),
    staleTime: 30 * 60_000,
    retry: false,
  });
  const fields = catalog.data?.items ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["study-pairs"] });

  const accept = useMutation({
    mutationFn: () => studyPairsApi.accept(proposal.id, answers),
    onSuccess: ({ pairActive }) => {
      void refresh();
      if (pairActive) toast(copy.active, "success");
    },
    onError: (error) =>
      toast(error instanceof ApiError ? error.message : copy.acceptError, "error"),
  });
  const decline = useMutation({
    mutationFn: () => studyPairsApi.decline(proposal.id),
    onSuccess: () => {
      void refresh();
      toast(copy.declined);
    },
    onError: (error) =>
      toast(error instanceof ApiError ? error.message : copy.declineError, "error"),
  });

  const set = (id: string, value: string) => {
    setMissing(false);
    setAnswers((current) => ({ ...current, [id]: value }));
  };

  const submit = () => {
    const unanswered = fields.some((field) => field.required && !(answers[field.id] ?? "").trim());
    if (unanswered) {
      setMissing(true);
      return;
    }
    accept.mutate();
  };

  const partnerName = proposal.partner.name || proposal.partner.username;
  const partnerAnswers = proposal.partnerIcebreaker ?? {};

  return (
    <article className="rounded-2xl border border-border bg-surface-1 p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            className="block truncate font-semibold text-foreground underline-offset-4 hover:underline"
            href={`/perfil/${proposal.partner.username}`}
          >
            {partnerName} · @{proposal.partner.username}
          </a>

          <p className="text-sm text-muted-foreground">{proposal.goal}</p>
        </div>

        <span className="text-xs text-muted-foreground">
          {copy.deadline(dataCurta(proposal.deadline))}
        </span>
      </header>

      <p className="mt-2 text-xs text-muted-foreground">
        {proposal.partnerAccepted ? copy.partnerAccepted : copy.partnerWaiting}
      </p>

      {proposal.partnerIcebreaker ? (
        <div className="mt-3 rounded-xl bg-surface-2 p-3">
          <p className="text-xs font-medium text-foreground">
            {copy.partnerIcebreaker} {partnerName}
          </p>

          {fields.map((field) => (
            <p key={field.id} className="mt-1 text-sm">
              <span className="text-muted-foreground">{questionOf(field)}</span>{" "}
              <span className="text-foreground">{partnerAnswers[field.id] || copy.noAnswer}</span>
            </p>
          ))}
        </div>
      ) : null}

      {!proposal.myAccepted && fields.length > 0 ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">{copy.icebreakerTitle}</p>

            <p className="text-xs text-muted-foreground">{copy.icebreakerHint}</p>
          </div>

          {fields.map((field) => (
            <IcebreakerField
              key={field.id}
              field={field}
              value={answers[field.id] ?? ""}
              onChange={(value) => set(field.id, value)}
            />
          ))}

          {missing ? (
            <p role="alert" className="text-xs text-destructive">
              {copy.requiredError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {proposal.myAccepted ? (
          <p className="text-sm text-muted-foreground">{copy.myAccepted}</p>
        ) : (
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={accept.isPending || decline.isPending}
            onClick={submit}
          >
            {accept.isPending ? copy.accepting : copy.accept}
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={accept.isPending || decline.isPending}
          onClick={() => decline.mutate()}
        >
          {copy.decline}
        </Button>
      </div>
    </article>
  );
}

function IcebreakerField({
  field,
  value,
  onChange,
}: {
  field: StudyPairIcebreakerField;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = optionsOf(field);
  const label = questionOf(field);
  const requirement = field.required ? copy.required : copy.optional;

  return (
    <fieldset>
      <legend className="text-sm text-foreground">
        {label} <span className="text-xs text-muted-foreground">({requirement})</span>
      </legend>

      {options ? (
        <div className="mt-1 flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={value === option ? "default" : "outline"}
              className="rounded-full"
              aria-pressed={value === option}
              onClick={() => onChange(value === option ? "" : option)}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : (
        <textarea
          className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
          rows={2}
          value={value}
          maxLength={500}
          placeholder={placeholderOf(field.id)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </fieldset>
  );
}
