import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import type { Personalization } from "@/types/application/preferences/personalization";
import {
  HealthyUsageDialog as HealthyUsageDialogView,
  type HealthyUsageValues,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { preferencesApi } from "@/lib/api";
import { writeBatataMode } from "@/lib/batata-mode";
import {
  HEALTHY_USAGE_MAX_MINUTES,
  HEALTHY_USAGE_MIN_MINUTES,
  clampMinutes,
  readHealthyUsage,
  writeHealthyUsage,
} from "@/lib/healthy-usage";
import {
  prefersReducedMotion,
  readCardTilt,
  readForceMotion,
  writeCardTilt,
  writeForceMotion,
  writeLiteMode,
} from "@/lib/lite-mode";
import { usePersonalization } from "@/lib/use-personalization";

/** Os assuntos reais da plataforma (mesma taxonomia das comunidades); "Todas" não é assunto. */
const TOPIC_OPTIONS = TOPICS.filter((topic) => topic !== "Todas").map((topic) => ({
  value: topic,
  label: TOPIC_LABELS[topic],
}));

function loadDeviceSettings() {
  const config = readHealthyUsage();
  return {
    enabled: config.enabled,
    minutes: config.minutes,
    forceMotion: readForceMotion(),
    cardTilt: readCardTilt(),
    reducedMotion: prefersReducedMotion(),
  };
}

/**
 * Uso saudável: o lembrete de pausa (local, do aparelho) + o centro de personalização
 * (assuntos preferidos, assuntos que não gosto e módulos desativados — com a fonte única
 * no backend, aplicada na navegação, nos feeds e nas recomendações).
 *
 * O BATATA é o único controle que vale no clique, sem esperar o "Salvar": ele muda a cara da
 * tela inteira, e a pessoa precisa ver o resultado para decidir se é isso que quer. A gravação
 * vai junto (mesma rota de preferências), com o espelho local aplicado antes da resposta e
 * desfeito se o servidor recusar.
 */
export function HealthyUsageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: personalization } = usePersonalization();

  const save = useMutation({
    mutationFn: (values: HealthyUsageValues) =>
      preferencesApi.setPersonalization({
        likedTopics: values.liked,
        blockedTopics: values.blocked,
        disabledModules: values.disabledModules,
        nightRestReminder: values.nightRestReminder,
        liteMode: values.liteMode,
        batataMode: values.batataMode,
      }),
    onSuccess: (_, values) => {
      writeHealthyUsage({ enabled: values.enabled, minutes: clampMinutes(values.minutes) });
      // O atributo no <html> e o cache mais folgado entram pelo LiteModeEffects assim que a
      // preferência volta do servidor; o espelho no aparelho só adianta o próximo paint.
      writeLiteMode(values.liteMode);
      writeBatataMode(values.batataMode);
      writeForceMotion(values.forceMotion);
      writeCardTilt(values.cardTilt);
      void queryClient.invalidateQueries({ queryKey: ["personalization"] });
      toast(texts.personalization.saved, "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.personalization.saveError, "error"),
  });

  /**
   * O interruptor do BATATA aplica e grava na hora. Otimista no cache: o `data-batata` no
   * `<html>` sai do LiteModeEffects, que lê a preferência — sem a atualização antecipada a tela
   * só mudaria depois da volta do servidor.
   */
  const toggleBatata = useMutation({
    mutationFn: (on: boolean) => preferencesApi.setPersonalization({ batataMode: on }),
    onMutate: (on) => {
      const previous = queryClient.getQueryData<Personalization>(["personalization"]);
      writeBatataMode(on);
      queryClient.setQueryData<Personalization>(["personalization"], (current) =>
        current ? { ...current, batataMode: on } : current,
      );
      return { previous };
    },
    onError: (error, _on, context) => {
      const previous = context?.previous;
      writeBatataMode(previous?.batataMode ?? false);
      if (previous) queryClient.setQueryData<Personalization>(["personalization"], previous);
      toast(error instanceof Error ? error.message : texts.personalization.batataError, "error");
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["personalization"] }),
  });

  return (
    <HealthyUsageDialogView
      open={open}
      onOpenChange={onOpenChange}
      loadDeviceSettings={loadDeviceSettings}
      personalization={personalization}
      topics={TOPIC_OPTIONS}
      minMinutes={HEALTHY_USAGE_MIN_MINUTES}
      maxMinutes={HEALTHY_USAGE_MAX_MINUTES}
      savePending={save.isPending}
      onBatataModeChange={(on) => toggleBatata.mutate(on)}
      onSave={(values) => save.mutate(values)}
    />
  );
}
