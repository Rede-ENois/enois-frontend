import { useId, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { NotificationPreferences as Preferences } from "@/types/application/notification/notification-preferences";
import type { PushState } from "@/types/components/notifications/push-state";
import {
  type NotificationPreferenceKey,
  NotificationPreferences,
  type NotificationPreferencesSaveStatus,
} from "@rede-enois/design-system/domain";
import { Switch } from "@rede-enois/design-system/ui";

import { notificationsApi } from "@/lib/api";

import { usePushState } from "./use-push-state";

const PREFERENCES_KEY = ["me", "notification-preferences"] as const;

/** Avisos no navegador deste aparelho: a chave que liga e desliga todas as categorias abaixo. */
function PushDeviceRow({ push }: { push: PushState }) {
  const id = useId();

  if (!push.available && !push.denied) return null;

  return (
    <section className="surface-card p-4">
      <h2 className="text-base font-medium text-text-strong">
        {texts.notificationPreferences.deviceTitle}
      </h2>

      <p className="mt-0.5 text-sm text-text-subtle">{texts.notificationPreferences.deviceHint}</p>

      {push.denied ? (
        // Com a permissão negada não há o que ligar daqui: o pedido não abre de novo.
        <p className="mt-3 text-sm text-text-subtle">{texts.account.menu.pushDenied}</p>
      ) : (
        <div className="mt-1 flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p id={`${id}-label`} className="text-sm font-medium text-text-strong">
              {push.active
                ? texts.notificationPreferences.deviceOn
                : texts.notificationPreferences.deviceOff}
            </p>
          </div>

          <Switch
            checked={push.active}
            disabled={push.busy}
            aria-busy={push.busy}
            aria-labelledby={`${id}-label`}
            onCheckedChange={() => push.toggle()}
          />
        </div>
      )}
    </section>
  );
}

/**
 * Preferências de notificação da conta sobre o `NotificationPreferences` do design system. Cada
 * switch salva sozinho com PUT parcial: o valor muda na hora e volta ao anterior se o servidor
 * recusar. A reversão é só da chave que falhou, para não desfazer outra que ainda está salvando.
 *
 * O mesmo bloco vive na página de preferências e dentro do "Uso saudável".
 */
export function NotificationPreferencesPanel() {
  const queryClient = useQueryClient();
  const push = usePushState();
  const [pending, setPending] = useState<Partial<Record<NotificationPreferenceKey, boolean>>>({});
  const [lastResult, setLastResult] = useState<NotificationPreferencesSaveStatus>("idle");

  const preferences = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: () => notificationsApi.preferences(),
  });

  const setKey = (key: NotificationPreferenceKey, value: boolean) =>
    queryClient.setQueryData<Preferences>(PREFERENCES_KEY, (current) =>
      current ? { ...current, [key]: value } : current,
    );

  const save = useMutation({
    mutationFn: ({ key, value }: { key: NotificationPreferenceKey; value: boolean }) =>
      notificationsApi.updatePreferences({ [key]: value }),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_KEY });
      const previous = queryClient.getQueryData<Preferences>(PREFERENCES_KEY)?.[key];
      setKey(key, value);
      setPending((current) => ({ ...current, [key]: true }));
      return { previous };
    },
    onSuccess: (saved, { key }) => {
      setKey(key, saved[key]);
      setLastResult("saved");
    },
    onError: (_error, { key }, context) => {
      if (context?.previous !== undefined) setKey(key, context.previous);
      setLastResult("error");
    },
    onSettled: (_data, _error, { key }) => setPending((current) => ({ ...current, [key]: false })),
  });

  const data = preferences.data;
  const saving = Object.values(pending).some(Boolean);

  return (
    <div className="space-y-4">
      <PushDeviceRow push={push} />
      <NotificationPreferences
        values={
          data
            ? {
                weeklyDigest: data.weeklyDigest,
                pushSocial: data.pushSocial,
                pushMessages: data.pushMessages,
                pushGroups: data.pushGroups,
                pushJobs: data.pushJobs,
                pushSystem: data.pushSystem,
              }
            : null
        }
        loading={preferences.isPending}
        loadError={preferences.isError && !data}
        onRetry={() => void preferences.refetch()}
        onChange={(key, value) => save.mutate({ key, value })}
        pending={pending}
        saveStatus={saving ? "saving" : lastResult}
        pushEnabled={push.active}
        pushBusy={push.busy}
      />
    </div>
  );
}
