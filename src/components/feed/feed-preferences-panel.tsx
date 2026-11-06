import { useId } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Personalization } from "@/types/application/preferences/personalization";
import { Switch } from "@rede-enois/design-system/ui";

import { preferencesApi } from "@/lib/api";
import { usePersonalization } from "@/lib/use-personalization";

const PERSONALIZATION_KEY = ["personalization"] as const;

/**
 * Preferências de feed da conta. O interruptor salva sozinho com PUT parcial em /me/preferences:
 * o valor muda na hora e volta ao anterior se o servidor recusar.
 */
export function FeedPreferencesPanel() {
  const id = useId();
  const queryClient = useQueryClient();
  const personalization = usePersonalization();

  const save = useMutation({
    mutationFn: (hideReposts: boolean) => preferencesApi.setPersonalization({ hideReposts }),
    onMutate: async (hideReposts) => {
      await queryClient.cancelQueries({ queryKey: PERSONALIZATION_KEY });
      const previous = queryClient.getQueryData<Personalization>(PERSONALIZATION_KEY);
      queryClient.setQueryData<Personalization>(PERSONALIZATION_KEY, (current) =>
        current ? { ...current, hideReposts } : current,
      );
      return { previous };
    },
    onError: (_error, _hideReposts, context) => {
      if (context?.previous) queryClient.setQueryData(PERSONALIZATION_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PERSONALIZATION_KEY });
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const data = personalization.data;

  return (
    <section className="surface-card p-4">
      <h2 className="text-base font-medium text-text-strong">
        {texts.feedPreferences.feedSection}
      </h2>

      {personalization.isPending && !data ? (
        <div
          className="mt-1 flex items-center justify-between gap-4 py-3 animate-pulse"
          aria-busy="true"
        >
          <div className="min-w-0 space-y-2">
            <div className="h-4 w-32 rounded bg-surface-2" />
            <div className="h-3.5 w-64 rounded bg-surface-2" />
          </div>

          <div className="h-6 w-11 rounded-full bg-surface-2" />
        </div>
      ) : personalization.isError && !data ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-text-subtle">{texts.feedPreferences.loadError}</p>

          <button
            type="button"
            className="text-sm font-medium text-text-strong underline underline-offset-2"
            onClick={() => void personalization.refetch()}
          >
            {texts.feedPreferences.retry}
          </button>
        </div>
      ) : (
        <div className="mt-1 flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p id={`${id}-label`} className="text-sm font-medium text-text-strong">
              {texts.feedPreferences.hideReposts}
            </p>

            <p className="text-sm text-text-subtle">{texts.feedPreferences.hideRepostsHint}</p>
            {save.isError && (
              <p className="mt-1 text-sm text-text-subtle">{texts.feedPreferences.saveError}</p>
            )}
          </div>

          <Switch
            checked={data?.hideReposts ?? false}
            disabled={!data || save.isPending}
            aria-busy={save.isPending}
            aria-labelledby={`${id}-label`}
            onCheckedChange={(checked) => save.mutate(checked)}
          />
        </div>
      )}
    </section>
  );
}
