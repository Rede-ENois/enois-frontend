import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { AvailabilityDraft } from "@/types/application/mentor/availability-draft";
import type { AvailabilityRule } from "@/types/application/mentor/availability-rule";
import { Button, Input, Label } from "@rede-enois/design-system/ui";
import { Plus, X } from "lucide-react";

import { mentorsApi } from "@/lib/api";

/** Ordem de exibição: segunda primeiro, como a semana de quem trabalha. */
const WEEK = [1, 2, 3, 4, 5, 6, 7];

const emptyDraft = (): AvailabilityDraft => Object.fromEntries(WEEK.map((day) => [day, []]));

const toDraft = (rules: AvailabilityRule[]): AvailabilityDraft => {
  const draft = emptyDraft();
  for (const rule of rules) {
    if (!draft[rule.dayOfWeek]) continue;
    draft[rule.dayOfWeek] = [...draft[rule.dayOfWeek], ...rule.times];
  }
  return draft;
};

const toItems = (draft: AvailabilityDraft): AvailabilityRule[] =>
  WEEK.filter((day) => draft[day].length > 0).map((day) => ({
    dayOfWeek: day,
    times: Array.from(new Set(draft[day].filter(Boolean))).sort(),
  }));

/**
 * Disponibilidade semanal dentro do card de edição da mentoria: escolher os dias e os horários, e
 * o backend publica os horários concretos das próximas quatro semanas — sem precisar criar um por
 * um. Horário já reservado nunca é removido por aqui.
 */
export function WeeklyAvailabilityEditor({ mentorId }: { mentorId: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<AvailabilityDraft>(emptyDraft);
  const [saved, setSaved] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mentor-availability", mentorId],
    queryFn: () => mentorsApi.getAvailability(mentorId),
  });

  useEffect(() => {
    if (data) setDraft(toDraft(data));
  }, [data]);

  const save = useMutation({
    mutationFn: () => mentorsApi.saveAvailability(mentorId, toItems(draft)),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["mentor-availability", mentorId] });
      queryClient.invalidateQueries({ queryKey: ["mentor-slots", mentorId] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
    onError: () => setSaved(false),
  });

  const toggleDay = (day: number, on: boolean) => {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      [day]: on ? (current[day].length ? current[day] : ["19:00"]) : [],
    }));
  };

  const setTime = (day: number, index: number, value: string) => {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      [day]: current[day].map((time, position) => (position === index ? value : time)),
    }));
  };

  const addTime = (day: number) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [day]: [...current[day], "20:00"] }));
  };

  const removeTime = (day: number, index: number) => {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      [day]: current[day].filter((_, position) => position !== index),
    }));
  };

  return (
    <section
      className="space-y-3 border-t border-border-soft pt-4"
      aria-label={texts.mentoring.availabilityTitle}
    >
      <div>
        <p className="text-sm font-medium">{texts.mentoring.availabilityTitle}</p>

        <p className="text-xs text-text-subtle">{texts.mentoring.availabilityHint}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-subtle">{texts.mentoring.availabilityLoading}</p>
      ) : isError ? (
        <p className="text-sm text-destructive">{texts.mentoring.availabilityError}</p>
      ) : (
        <div className="space-y-2">
          {WEEK.map((day) => {
            const active = draft[day].length > 0;
            return (
              <div key={day} className="rounded-xl border border-border-soft px-3 py-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => toggleDay(day, event.target.checked)}
                    aria-label={texts.mentoring.weekdays[day - 1]}
                  />

                  <span className="font-medium">{texts.mentoring.weekdays[day - 1]}</span>
                </label>

                {active && (
                  <div className="mt-2 space-y-1.5 pl-6">
                    {draft[day].map((time, index) => (
                      <div key={`${day}-${index}`} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={time}
                          aria-label={texts.mentoring.availabilityTimeLabel(
                            texts.mentoring.weekdays[day - 1],
                          )}
                          onChange={(event) => setTime(day, index, event.target.value)}
                          className="h-9 w-32"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-destructive"
                          aria-label={texts.mentoring.availabilityRemoveTime}
                          onClick={() => removeTime(day, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => addTime(day)}
                      disabled={draft[day].length >= 12}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      {texts.mentoring.availabilityAddTime}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {saved && <p className="text-sm text-growth">{texts.mentoring.availabilitySaved}</p>}
      {save.isError && (
        <p className="text-sm text-destructive">{texts.mentoring.availabilitySaveError}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs text-muted-foreground">
          {texts.mentoring.availabilityFooter}
        </Label>

        <Button
          type="button"
          className="rounded-full"
          disabled={save.isPending || isLoading || isError}
          onClick={() => {
            setSaved(false);
            save.mutate();
          }}
        >
          {save.isPending ? texts.common.saving : texts.mentoring.availabilitySave}
        </Button>
      </div>
    </section>
  );
}
